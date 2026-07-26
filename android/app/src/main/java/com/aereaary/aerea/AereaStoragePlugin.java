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

    static class AereaDatabase extends SQLiteOpenHelper {
        AereaDatabase(Context context) {
            super(context, "aerea-private.db", null, 2);
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
        }
    }
}
