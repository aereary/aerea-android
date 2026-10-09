package com.aereaary.aerea;
import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.Test;
import org.junit.Rule;
import org.junit.rules.TemporaryFolder;
import java.io.File;
import java.nio.file.Files;
import static org.junit.Assert.*;

public class AereaRecordingStoreTest {
    @Rule public TemporaryFolder temporary = new TemporaryFolder();
    private static final String FIRST = "12345678-1234-1234-1234-123456789abc";
    private static final String SECOND = "12345678-1234-1234-1234-123456789abd";
    private JSONObject session(String id) throws Exception { return new JSONObject().put("sessionId", id).put("name", "Lecture").put("notes", "Private notes").put("id", 42); }
    @Test public void completedAudioSurvivesStoreRecreationUntilAcknowledged() throws Exception {
        File folder = temporary.newFolder(); AereaRecordingStore store = new AereaRecordingStore(folder);
        store.start(session(FIRST)); Files.write(store.audio(FIRST).toPath(), new byte[]{1,2,3});
        store.finish(3600, null, true);
        JSONObject saved = new AereaRecordingStore(folder).read().getJSONArray("pending").getJSONObject(0);
        assertEquals(3600, saved.getLong("duration")); assertEquals("Private notes", saved.getString("notes"));
        assertTrue(saved.getString("url").startsWith("file://")); assertFalse(store.read().has("active"));
        store.acknowledge(new JSONArray().put(FIRST)); store.acknowledge(new JSONArray().put(FIRST));
        assertEquals(0, store.read().getJSONArray("pending").length()); assertTrue(store.audio(FIRST).exists());
    }
    @Test public void duplicateStopCannotCreateDuplicateAudio() throws Exception {
        AereaRecordingStore store = new AereaRecordingStore(temporary.newFolder());
        store.start(session(FIRST)); store.finish(30, null, true); store.finish(31, null, true);
        assertEquals(1, store.read().getJSONArray("pending").length());
    }
    @Test public void duplicateStartCannotOverwriteOriginalClassMetadata() throws Exception {
        AereaRecordingStore store = new AereaRecordingStore(temporary.newFolder()); store.start(session(FIRST));
        try { store.start(session(SECOND)); fail("Must reject second microphone owner"); } catch (IllegalStateException expected) {}
        assertEquals(FIRST, store.read().getJSONObject("active").getString("sessionId"));
    }
    @Test public void acknowledgementPreservesOtherUnimportedRecordings() throws Exception {
        AereaRecordingStore store = new AereaRecordingStore(temporary.newFolder());
        store.start(session(FIRST)); store.finish(30, null, true); store.start(session(SECOND)); store.finish(40, null, true);
        store.acknowledge(new JSONArray().put(FIRST));
        assertEquals(SECOND, store.read().getJSONArray("pending").getJSONObject(0).getString("sessionId"));
    }
    @Test public void failedCaptureLeavesNoEmptyRecordingOrOrphanAudio() throws Exception {
        AereaRecordingStore store = new AereaRecordingStore(temporary.newFolder()); store.start(session(FIRST));
        Files.write(store.audio(FIRST).toPath(), new byte[]{1}); store.finish(0, "No audio", false);
        assertFalse(store.audio(FIRST).exists()); assertFalse(store.read().has("active"));
        assertEquals(0, store.read().getJSONArray("pending").length()); assertEquals("No audio", store.read().getString("error"));
    }
    @Test public void deletionRemovesSavedFileAndPendingImport() throws Exception {
        AereaRecordingStore store = new AereaRecordingStore(temporary.newFolder()); store.start(session(FIRST));
        Files.write(store.audio(FIRST).toPath(), new byte[]{1}); store.finish(10, null, true); store.delete(FIRST);
        assertFalse(store.audio(FIRST).exists()); assertEquals(0, store.read().getJSONArray("pending").length());
    }
    @Test public void activeRecordingCannotBeDeleted() throws Exception {
        AereaRecordingStore store = new AereaRecordingStore(temporary.newFolder()); store.start(session(FIRST));
        try { store.delete(FIRST); fail("Must preserve active audio"); } catch (IllegalStateException expected) {}
        assertTrue(store.read().has("active"));
    }
    @Test public void audioPathsCannotEscapePrivateRecordingDirectory() throws Exception {
        AereaRecordingStore store = new AereaRecordingStore(temporary.newFolder());
        try { store.audio("../../secret"); fail("Must reject traversal"); } catch (IllegalArgumentException expected) {}
    }
}
