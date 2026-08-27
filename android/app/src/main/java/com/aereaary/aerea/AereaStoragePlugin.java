package com.aereaary.aerea;

import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;
import android.util.Base64;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.util.UUID;
import java.util.regex.Pattern;

@CapacitorPlugin(name = "AereaStorage")
public class AereaStoragePlugin extends Plugin {
    private static final long MAX_STUDY_FILE_BYTES = 40L * 1024L * 1024L;
    private static final Pattern DRIVE_FILE_ID = Pattern.compile("^[A-Za-z0-9_-]{8,200}$");
    private AereaDatabase database;

    @Override
    public void load() {
        database = new AereaDatabase(getContext());
    }

    private JSObject studyFileJson(String id, String name, long size, long createdAt, long updatedAt) {
        JSObject file = new JSObject();
        file.put("id", id);
        file.put("name", name);
        file.put("mediaType", "application/epub+zip");
        file.put("kind", "epub");
        file.put("size", size);
        file.put("createdAt", Instant.ofEpochMilli(createdAt).toString());
        file.put("updatedAt", Instant.ofEpochMilli(updatedAt).toString());
        return file;
    }

    private String safeEpubName(String requestedName, int workId) {
        String name = requestedName == null ? "" : requestedName
                .replace('\u0000', ' ')
                .replace('\r', ' ')
                .replace('\n', ' ')
                .trim();
        if (name.isEmpty()) name = "AO3 work " + workId + ".epub";
        if (!name.toLowerCase().endsWith(".epub")) name += ".epub";
        if (name.length() > 180) {
            name = name.substring(0, 175).trim() + ".epub";
        }
        return name;
    }

    private boolean isEpubArchive(File file) throws Exception {
        try (FileInputStream stream = new FileInputStream(file)) {
            return stream.read() == 'P' && stream.read() == 'K';
        }
    }

    @PluginMethod
    public void getState(PluginCall call) {
        try (Cursor cursor = database.getReadableDatabase().query(
                "documents", new String[]{"payload"}, "document_key=?",
                new String[]{"application_state"}, null, null, null)) {
            JSObject result = new JSObject();
            result.put("state", cursor.moveToFirst() ? cursor.getString(0) : null);
            call.resolve(result);
        }
    }

    @PluginMethod
    public void putState(PluginCall call) {
        String state = call.getString("state");
        if (state == null) {
            call.reject("state is required");
            return;
        }
        ContentValues values = new ContentValues();
        values.put("document_key", "application_state");
        values.put("payload", state);
        values.put("updated_at", System.currentTimeMillis());
        database.getWritableDatabase().insertWithOnConflict(
                "documents", null, values, SQLiteDatabase.CONFLICT_REPLACE);
        call.resolve();
    }

    @PluginMethod
    public void clearPersonalContent(PluginCall call) {
        SQLiteDatabase writable = database.getWritableDatabase();
        try {
            deleteStoredFiles(writable, "sketches");
            deleteStoredFiles(writable, "study_files");
            deleteStoredFiles(writable, "library_files");

            writable.beginTransaction();
            try {
                writable.delete("sketches", null, null);
                writable.delete("study_files", null, null);
                writable.delete("library_files", null, null);
                writable.setTransactionSuccessful();
            } finally {
                writable.endTransaction();
            }

            clearDirectoryContents(new File(getContext().getFilesDir(), "sketches"));
            clearDirectoryContents(new File(getContext().getFilesDir(), "study-files"));
            clearDirectoryContents(new File(getContext().getFilesDir(), "library"));
            call.resolve();
        } catch (Exception error) {
            call.reject("Could not clear personal content", error);
        }
    }

    @PluginMethod
    public void listSketches(PluginCall call) {
        JSArray pages = new JSArray();
        try (Cursor cursor = database.getReadableDatabase().query(
                "sketches", new String[]{"id", "title", "page_style", "path", "created_at", "updated_at"},
                null, null, null, null, "updated_at DESC")) {
            while (cursor.moveToNext()) {
                File image = new File(cursor.getString(3));
                if (!image.isFile()) continue;
                JSObject page = new JSObject();
                page.put("id", cursor.getString(0));
                page.put("title", cursor.getString(1));
                page.put("pageStyle", cursor.getString(2));
                page.put("createdAt", Instant.ofEpochMilli(cursor.getLong(4)).toString());
                page.put("updatedAt", Instant.ofEpochMilli(cursor.getLong(5)).toString());
                page.put("dataUrl", "data:image/png;base64," +
                        Base64.encodeToString(Files.readAllBytes(image.toPath()), Base64.NO_WRAP));
                pages.put(page);
            }
            JSObject result = new JSObject();
            result.put("pages", pages);
            call.resolve(result);
        } catch (Exception error) {
            call.reject("Could not read sketches", error);
        }
    }

    @PluginMethod
    public void saveSketch(PluginCall call) {
        String dataUrl = call.getString("dataUrl");
        if (dataUrl == null || !dataUrl.contains(",")) {
            call.reject("A PNG data URL is required");
            return;
        }
        String id = UUID.randomUUID().toString();
        long now = System.currentTimeMillis();
        File directory = new File(getContext().getFilesDir(), "sketches");
        File image = new File(directory, id + ".png");
        try {
            if (!directory.exists() && !directory.mkdirs()) {
                throw new IllegalStateException("Could not create sketch directory");
            }
            byte[] bytes = Base64.decode(dataUrl.substring(dataUrl.indexOf(',') + 1), Base64.DEFAULT);
            try (FileOutputStream stream = new FileOutputStream(image)) {
                stream.write(bytes);
            }
            ContentValues values = new ContentValues();
            values.put("id", id);
            values.put("title", call.getString("title", "Untitled page"));
            values.put("page_style", call.getString("pageStyle", "plain"));
            values.put("path", image.getAbsolutePath());
            values.put("created_at", now);
            values.put("updated_at", now);
            database.getWritableDatabase().insertOrThrow("sketches", null, values);
            call.resolve();
        } catch (Exception error) {
            image.delete();
            call.reject("Could not save sketch", error);
        }
    }

    @PluginMethod
    public void deleteSketch(PluginCall call) {
        String id = call.getString("id");
        if (id == null) {
            call.reject("id is required");
            return;
        }
        try (Cursor cursor = database.getReadableDatabase().query(
                "sketches", new String[]{"path"}, "id=?", new String[]{id},
                null, null, null)) {
            if (cursor.moveToFirst()) new File(cursor.getString(0)).delete();
        }
        database.getWritableDatabase().delete("sketches", "id=?", new String[]{id});
        call.resolve();
    }

    @PluginMethod
    public void listDocuments(PluginCall call) {
        JSArray files = new JSArray();
        try (Cursor cursor = database.getReadableDatabase().query(
                "study_files",
                new String[]{"id", "name", "media_type", "kind", "path", "size", "created_at", "updated_at"},
                null, null, null, null, "updated_at DESC")) {
            while (cursor.moveToNext()) {
                File stored = new File(cursor.getString(4));
                if (!stored.isFile()) continue;
                JSObject file = new JSObject();
                file.put("id", cursor.getString(0));
                file.put("name", cursor.getString(1));
                file.put("mediaType", cursor.getString(2));
                file.put("kind", cursor.getString(3));
                file.put("size", cursor.getLong(5));
                file.put("createdAt", Instant.ofEpochMilli(cursor.getLong(6)).toString());
                file.put("updatedAt", Instant.ofEpochMilli(cursor.getLong(7)).toString());
                files.put(file);
            }
            JSObject result = new JSObject();
            result.put("files", files);
            call.resolve(result);
        } catch (Exception error) {
            call.reject("Could not read study files", error);
        }
    }

    @PluginMethod
    public void saveDocument(PluginCall call) {
        String dataUrl = call.getString("dataUrl");
        if (dataUrl == null || !dataUrl.contains(",")) {
            call.reject("A file data URL is required");
            return;
        }
        String id = UUID.randomUUID().toString();
        String name = call.getString("name", "Imported file");
        String mediaType = call.getString("mediaType", "application/octet-stream");
        String kind = call.getString("kind", "file");
        String extension = "pdf".equals(kind) ? ".pdf" : "epub".equals(kind) ? ".epub" : ".bin";
        long now = System.currentTimeMillis();
        File directory = new File(getContext().getFilesDir(), "study-files");
        File stored = new File(directory, id + extension);
        try {
            if (!directory.exists() && !directory.mkdirs()) {
                throw new IllegalStateException("Could not create study file directory");
            }
            byte[] bytes = Base64.decode(dataUrl.substring(dataUrl.indexOf(',') + 1), Base64.DEFAULT);
            if (bytes.length > 40 * 1024 * 1024) {
                call.reject("This file is larger than 40 MB");
                return;
            }
            try (FileOutputStream stream = new FileOutputStream(stored)) {
                stream.write(bytes);
            }
            ContentValues values = new ContentValues();
            values.put("id", id);
            values.put("name", name);
            values.put("media_type", mediaType);
            values.put("kind", kind);
            values.put("path", stored.getAbsolutePath());
            values.put("size", bytes.length);
            values.put("created_at", now);
            values.put("updated_at", now);
            database.getWritableDatabase().insertOrThrow("study_files", null, values);

            JSObject file = new JSObject();
            file.put("id", id);
            file.put("name", name);
            file.put("mediaType", mediaType);
            file.put("kind", kind);
            file.put("size", bytes.length);
            file.put("createdAt", Instant.ofEpochMilli(now).toString());
            file.put("updatedAt", Instant.ofEpochMilli(now).toString());
            JSObject result = new JSObject();
            result.put("file", file);
            call.resolve(result);
        } catch (Exception error) {
            stored.delete();
            call.reject("Could not save study file", error);
        }
    }

    @PluginMethod
    public void downloadAo3Epub(PluginCall call) {
        String requestedDriveFileId = call.getString("driveFileId");
        Integer workId = call.getInt("workId");
        if (requestedDriveFileId == null || workId == null || workId <= 0) {
            call.reject("A Drive file id and AO3 work id are required");
            return;
        }
        String driveFileId = requestedDriveFileId.trim();
        if (!DRIVE_FILE_ID.matcher(driveFileId).matches()) {
            call.reject("The Drive file id is invalid");
            return;
        }
        String fileName = safeEpubName(call.getString("fileName"), workId);

        // Capacitor dispatches plugin methods on its worker HandlerThread.
            String existingId = null;
            String existingName = null;
            String existingPath = null;
            String existingDriveFileId = null;
            long existingSize = 0;
            long existingCreatedAt = 0;
            long existingUpdatedAt = 0;
            try (Cursor cursor = database.getReadableDatabase().query(
                    "study_files",
                    new String[]{"id", "name", "path", "size", "created_at", "updated_at", "source_drive_file_id"},
                    "source_drive_file_id=? OR source_work_id=?",
                    new String[]{driveFileId, String.valueOf(workId)},
                    null, null, "updated_at DESC", "1")) {
                if (cursor.moveToFirst()) {
                    existingId = cursor.getString(0);
                    existingName = cursor.getString(1);
                    existingPath = cursor.getString(2);
                    existingSize = cursor.getLong(3);
                    existingCreatedAt = cursor.getLong(4);
                    existingUpdatedAt = cursor.getLong(5);
                    existingDriveFileId = cursor.getString(6);
                }
            } catch (Exception error) {
                call.reject("Could not check Your Library for this EPUB", error);
                return;
            }

            File existingFile = existingPath == null ? null : new File(existingPath);
            if (driveFileId.equals(existingDriveFileId) && existingFile != null && existingFile.isFile()) {
                JSObject result = new JSObject();
                result.put("file", studyFileJson(
                        existingId, existingName, existingSize, existingCreatedAt, existingUpdatedAt));
                result.put("alreadyStored", true);
                result.put("replaced", false);
                call.resolve(result);
                return;
            }

            String id = existingId == null ? UUID.randomUUID().toString() : existingId;
            long now = System.currentTimeMillis();
            long createdAt = existingId == null ? now : existingCreatedAt;
            File directory = new File(getContext().getFilesDir(), "study-files");
            File stored = existingFile == null ? new File(directory, id + ".epub") : existingFile;
            File pending = new File(directory, id + ".epub.download");
            HttpURLConnection connection = null;
            try {
                if (!directory.exists() && !directory.mkdirs()) {
                    throw new IllegalStateException("Could not create study file directory");
                }
                URL url = new URL(
                        "https://drive.usercontent.google.com/download?id=" +
                        URLEncoder.encode(driveFileId, StandardCharsets.UTF_8.toString()) +
                        "&export=download&confirm=t");
                connection = (HttpURLConnection) url.openConnection();
                connection.setInstanceFollowRedirects(true);
                connection.setRequestMethod("GET");
                connection.setConnectTimeout(20_000);
                connection.setReadTimeout(60_000);
                connection.setRequestProperty("Accept", "application/epub+zip,application/zip,*/*");
                connection.setRequestProperty("User-Agent", "aerea-android");

                int status = connection.getResponseCode();
                if (status < 200 || status >= 300) {
                    throw new IllegalStateException("Google Drive returned HTTP " + status);
                }
                long declaredLength = connection.getContentLengthLong();
                if (declaredLength > MAX_STUDY_FILE_BYTES) {
                    throw new IllegalStateException("This EPUB is larger than 40 MB");
                }

                long size = 0;
                try (BufferedInputStream input = new BufferedInputStream(connection.getInputStream());
                     FileOutputStream output = new FileOutputStream(pending)) {
                    byte[] buffer = new byte[16 * 1024];
                    int count;
                    while ((count = input.read(buffer)) != -1) {
                        size += count;
                        if (size > MAX_STUDY_FILE_BYTES) {
                            throw new IllegalStateException("This EPUB is larger than 40 MB");
                        }
                        output.write(buffer, 0, count);
                    }
                }
                if (size == 0 || !isEpubArchive(pending)) {
                    throw new IllegalStateException("Google Drive did not return a valid EPUB file");
                }

                try {
                    Files.move(
                            pending.toPath(), stored.toPath(),
                            StandardCopyOption.REPLACE_EXISTING,
                            StandardCopyOption.ATOMIC_MOVE);
                } catch (Exception atomicMoveError) {
                    Files.move(
                            pending.toPath(), stored.toPath(),
                            StandardCopyOption.REPLACE_EXISTING);
                }

                ContentValues values = new ContentValues();
                values.put("name", fileName);
                values.put("media_type", "application/epub+zip");
                values.put("kind", "epub");
                values.put("path", stored.getAbsolutePath());
                values.put("size", size);
                values.put("updated_at", now);
                values.put("source_drive_file_id", driveFileId);
                values.put("source_work_id", workId);
                if (existingId == null) {
                    values.put("id", id);
                    values.put("created_at", createdAt);
                    database.getWritableDatabase().insertOrThrow("study_files", null, values);
                } else {
                    database.getWritableDatabase().update(
                            "study_files", values, "id=?", new String[]{id});
                }

                JSObject result = new JSObject();
                result.put("file", studyFileJson(id, fileName, size, createdAt, now));
                result.put("alreadyStored", false);
                result.put("replaced", existingId != null);
                call.resolve(result);
            } catch (Exception error) {
                pending.delete();
                call.reject("Could not save this EPUB from Google Drive", error);
            } finally {
                if (connection != null) connection.disconnect();
            }
    }

    @PluginMethod
    public void getDocument(PluginCall call) {
        String id = call.getString("id");
        if (id == null) {
            call.reject("id is required");
            return;
        }
        try (Cursor cursor = database.getReadableDatabase().query(
                "study_files", new String[]{"media_type", "path"}, "id=?", new String[]{id},
                null, null, null)) {
            if (!cursor.moveToFirst()) {
                call.reject("Study file not found");
                return;
            }
            File stored = new File(cursor.getString(1));
            if (!stored.isFile()) {
                call.reject("Stored study file not found");
                return;
            }
            JSObject result = new JSObject();
            result.put("dataUrl", "data:" + cursor.getString(0) + ";base64," +
                    Base64.encodeToString(Files.readAllBytes(stored.toPath()), Base64.NO_WRAP));
            call.resolve(result);
        } catch (Exception error) {
            call.reject("Could not open study file", error);
        }
    }

    @PluginMethod
    public void deleteDocument(PluginCall call) {
        String id = call.getString("id");
        if (id == null) {
            call.reject("id is required");
            return;
        }
        try (Cursor cursor = database.getReadableDatabase().query(
                "study_files", new String[]{"path"}, "id=?", new String[]{id},
                null, null, null)) {
            if (cursor.moveToFirst()) new File(cursor.getString(0)).delete();
        }
        database.getWritableDatabase().delete("study_files", "id=?", new String[]{id});
        call.resolve();
    }

    @PluginMethod
    public void saveFile(PluginCall call) {
        String dataUrl = call.getString("dataUrl");
        if (dataUrl == null || !dataUrl.contains(",")) {
            call.reject("A file data URL is required");
            return;
        }
        String id = UUID.randomUUID().toString();
        long now = System.currentTimeMillis();
        File directory = new File(getContext().getFilesDir(), "library");
        File file = new File(directory, id + ".bin");
        try {
            if (!directory.exists() && !directory.mkdirs()) {
                throw new IllegalStateException("Could not create Library directory");
            }
            byte[] bytes = Base64.decode(dataUrl.substring(dataUrl.indexOf(',') + 1), Base64.DEFAULT);
            try (FileOutputStream stream = new FileOutputStream(file)) {
                stream.write(bytes);
            }
            ContentValues values = new ContentValues();
            values.put("id", id);
            values.put("name", call.getString("name", "Untitled file"));
            values.put("mime_type", call.getString("mimeType", "application/octet-stream"));
            values.put("path", file.getAbsolutePath());
            values.put("created_at", now);
            values.put("updated_at", now);
            database.getWritableDatabase().insertOrThrow("library_files", null, values);
            JSObject result = new JSObject();
            result.put("id", id);
            call.resolve(result);
        } catch (Exception error) {
            file.delete();
            call.reject("Could not save Library file", error);
        }
    }

    @PluginMethod
    public void readFile(PluginCall call) {
        String id = call.getString("id");
        if (id == null) {
            call.reject("id is required");
            return;
        }
        try (Cursor cursor = database.getReadableDatabase().query(
                "library_files", new String[]{"name", "mime_type", "path"}, "id=?",
                new String[]{id}, null, null, null)) {
            if (!cursor.moveToFirst()) {
                call.reject("Library file not found");
                return;
            }
            File file = new File(cursor.getString(2));
            if (!file.isFile()) {
                call.reject("Library file is unavailable");
                return;
            }
            String mimeType = cursor.getString(1);
            JSObject result = new JSObject();
            result.put("name", cursor.getString(0));
            result.put("mimeType", mimeType);
            result.put("dataUrl", "data:" + mimeType + ";base64," +
                    Base64.encodeToString(Files.readAllBytes(file.toPath()), Base64.NO_WRAP));
            call.resolve(result);
        } catch (Exception error) {
            call.reject("Could not read Library file", error);
        }
    }

    @PluginMethod
    public void deleteFile(PluginCall call) {
        String id = call.getString("id");
        if (id == null) {
            call.reject("id is required");
            return;
        }
        try (Cursor cursor = database.getReadableDatabase().query(
                "library_files", new String[]{"path"}, "id=?", new String[]{id},
                null, null, null)) {
            if (cursor.moveToFirst()) new File(cursor.getString(0)).delete();
        }
        database.getWritableDatabase().delete("library_files", "id=?", new String[]{id});
        call.resolve();
    }

    private void deleteStoredFiles(SQLiteDatabase db, String table) {
        try (Cursor cursor = db.query(
                table, new String[]{"path"}, null, null, null, null, null)) {
            while (cursor.moveToNext()) {
                String path = cursor.getString(0);
                if (path != null) new File(path).delete();
            }
        }
    }

    private void clearDirectoryContents(File directory) {
        File[] children = directory.listFiles();
        if (children == null) return;
        for (File child : children) {
            if (child.isDirectory()) clearDirectoryContents(child);
            if (!child.delete() && child.exists()) {
                throw new IllegalStateException("Could not delete " + child.getName());
            }
        }
    }

    static class AereaDatabase extends SQLiteOpenHelper {
        AereaDatabase(Context context) {
            super(context, "aerea-private.db", null, 5);
        }

        @Override
        public void onCreate(SQLiteDatabase db) {
            db.execSQL("CREATE TABLE documents (" +
                    "document_key TEXT PRIMARY KEY NOT NULL," +
                    "payload TEXT NOT NULL," +
                    "updated_at INTEGER NOT NULL)");
            db.execSQL("CREATE TABLE sketches (" +
                    "id TEXT PRIMARY KEY NOT NULL," +
                    "title TEXT NOT NULL," +
                    "page_style TEXT NOT NULL," +
                    "path TEXT NOT NULL," +
                    "created_at INTEGER NOT NULL," +
                    "updated_at INTEGER NOT NULL)");
            db.execSQL("CREATE TABLE study_files (" +
                    "id TEXT PRIMARY KEY NOT NULL," +
                    "name TEXT NOT NULL," +
                    "media_type TEXT NOT NULL," +
                    "kind TEXT NOT NULL," +
                    "path TEXT NOT NULL," +
                    "size INTEGER NOT NULL," +
                    "source_drive_file_id TEXT," +
                    "source_work_id INTEGER," +
                    "created_at INTEGER NOT NULL," +
                    "updated_at INTEGER NOT NULL)");
            db.execSQL("CREATE UNIQUE INDEX study_files_ao3_drive_idx " +
                    "ON study_files(source_drive_file_id) WHERE source_drive_file_id IS NOT NULL");
            db.execSQL("CREATE UNIQUE INDEX study_files_ao3_work_idx " +
                    "ON study_files(source_work_id) WHERE source_work_id IS NOT NULL");
            db.execSQL("CREATE TABLE library_files (" +
                    "id TEXT PRIMARY KEY NOT NULL," +
                    "name TEXT NOT NULL," +
                    "mime_type TEXT NOT NULL," +
                    "path TEXT NOT NULL," +
                    "created_at INTEGER NOT NULL," +
                    "updated_at INTEGER NOT NULL)");
        }

        @Override
        public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {
            if (oldVersion < 2) {
                db.execSQL("CREATE TABLE IF NOT EXISTS sketches (" +
                        "id TEXT PRIMARY KEY NOT NULL," +
                        "title TEXT NOT NULL," +
                        "page_style TEXT NOT NULL," +
                        "path TEXT NOT NULL," +
                        "created_at INTEGER NOT NULL," +
                        "updated_at INTEGER NOT NULL)");
            }
            if (oldVersion < 3) {
                db.execSQL("CREATE TABLE IF NOT EXISTS study_files (" +
                        "id TEXT PRIMARY KEY NOT NULL," +
                        "name TEXT NOT NULL," +
                        "media_type TEXT NOT NULL," +
                        "kind TEXT NOT NULL," +
                        "path TEXT NOT NULL," +
                        "size INTEGER NOT NULL," +
                        "created_at INTEGER NOT NULL," +
                        "updated_at INTEGER NOT NULL)");
            }
            if (oldVersion < 4) {
                db.execSQL("CREATE TABLE IF NOT EXISTS library_files (" +
                        "id TEXT PRIMARY KEY NOT NULL," +
                        "name TEXT NOT NULL," +
                        "mime_type TEXT NOT NULL," +
                        "path TEXT NOT NULL," +
                        "created_at INTEGER NOT NULL," +
                        "updated_at INTEGER NOT NULL)");
            }
            if (oldVersion < 5) {
                db.execSQL("ALTER TABLE study_files ADD COLUMN source_drive_file_id TEXT");
                db.execSQL("ALTER TABLE study_files ADD COLUMN source_work_id INTEGER");
                db.execSQL("CREATE UNIQUE INDEX IF NOT EXISTS study_files_ao3_drive_idx " +
                        "ON study_files(source_drive_file_id) WHERE source_drive_file_id IS NOT NULL");
                db.execSQL("CREATE UNIQUE INDEX IF NOT EXISTS study_files_ao3_work_idx " +
                        "ON study_files(source_work_id) WHERE source_work_id IS NOT NULL");
            }
        }
    }
}
