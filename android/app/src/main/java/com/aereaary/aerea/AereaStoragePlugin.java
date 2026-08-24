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

import java.io.File;
import java.io.FileOutputStream;
import java.nio.file.Files;
import java.time.Instant;
import java.util.UUID;

@CapacitorPlugin(name = "AereaStorage")
public class AereaStoragePlugin extends Plugin {
    private AereaDatabase database;

    @Override
    public void load() {
        database = new AereaDatabase(getContext());
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

    static class AereaDatabase extends SQLiteOpenHelper {
        AereaDatabase(Context context) {
            super(context, "aerea-private.db", null, 4);
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
                    "created_at INTEGER NOT NULL," +
                    "updated_at INTEGER NOT NULL)");
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
        }
    }
}
