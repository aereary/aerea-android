package com.aereaary.aerea;

import org.json.JSONArray;
import org.json.JSONObject;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;

/** Durable outbox: audio survives WebView recreation and failed app-state saves. */
final class AereaRecordingStore {
    private final File directory;
    AereaRecordingStore(File directory) { this.directory = directory; }
    File audio(String session) {
        if (!session.matches("[a-f0-9-]{36}")) throw new IllegalArgumentException("Invalid recording ID");
        return new File(directory, session + ".m4a");
    }
    synchronized JSONObject read() throws Exception {
        File journal = new File(directory, "sessions.json");
        if (!journal.exists()) return new JSONObject().put("pending", new JSONArray());
        try (FileInputStream input = new FileInputStream(journal)) {
            java.io.ByteArrayOutputStream bytes = new java.io.ByteArrayOutputStream();
            byte[] buffer = new byte[4096]; int size;
            while ((size = input.read(buffer)) != -1) bytes.write(buffer, 0, size);
            return new JSONObject(bytes.toString("UTF-8"));
        }
    }
    private void write(JSONObject journal) throws Exception {
        if (!directory.exists() && !directory.mkdirs()) throw new java.io.IOException("Cannot create audio storage");
        File temporary = new File(directory, "sessions.tmp");
        try (FileOutputStream output = new FileOutputStream(temporary)) {
            output.write(journal.toString().getBytes(StandardCharsets.UTF_8));
            output.getFD().sync();
        }
        if (!temporary.renameTo(new File(directory, "sessions.json"))) throw new java.io.IOException("Cannot save recording metadata");
    }
    synchronized void start(JSONObject session) throws Exception {
        JSONObject journal = read();
        if (journal.has("active")) throw new IllegalStateException("A recording is already active");
        journal.remove("error"); journal.put("active", session); write(journal);
    }
    synchronized void finish(long seconds, String error, boolean playable) throws Exception {
        JSONObject journal = read(); JSONObject active = journal.optJSONObject("active");
        if (active == null) return;
        if (playable) {
            active.put("duration", seconds);
            active.put("url", "file://" + audio(active.getString("sessionId")).getAbsolutePath());
            JSONArray pending = journal.optJSONArray("pending");
            if (pending == null) pending = new JSONArray();
            pending.put(active); journal.put("pending", pending);
        } else audio(active.getString("sessionId")).delete();
        journal.remove("active");
        if (error != null) journal.put("error", error);
        write(journal);
    }
    synchronized void acknowledge(JSONArray sessions) throws Exception {
        JSONObject journal = read(); JSONArray pending = journal.optJSONArray("pending");
        JSONArray remaining = new JSONArray();
        if (pending != null) for (int i = 0; i < pending.length(); i++) {
            JSONObject item = pending.getJSONObject(i); boolean acknowledged = false;
            for (int j = 0; j < sessions.length(); j++) if (item.getString("sessionId").equals(sessions.getString(j))) acknowledged = true;
            if (!acknowledged) remaining.put(item);
        }
        journal.put("pending", remaining); write(journal);
    }
    synchronized void delete(String session) throws Exception {
        JSONObject journal = read(); JSONObject active = journal.optJSONObject("active");
        if (active != null && session.equals(active.optString("sessionId"))) throw new IllegalStateException("Stop recording before deleting it");
        acknowledge(new JSONArray().put(session));
        if (audio(session).exists() && !audio(session).delete()) throw new java.io.IOException("Cannot delete audio");
    }
}
