package com.aereaary.aerea;

import android.Manifest;
import android.content.Intent;
import android.net.Uri;
import android.provider.Settings;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.ResultReceiver;
import android.media.MediaMetadataRetriever;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSArray;
import org.json.JSONObject;
import java.util.UUID;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;

@CapacitorPlugin(
    name = "AereaMicrophone",
    permissions = {
        @Permission(alias = "microphone", strings = { Manifest.permission.RECORD_AUDIO })
    }
)
public class AereaMicrophonePlugin extends Plugin {
    private static final String MICROPHONE_ALIAS = "microphone";

    @PluginMethod public void recordingStatus(PluginCall call) {
        try {
            AereaRecordingStore store = AereaRecordingService.store(getContext());
            JSONObject journal = store.read();
            JSONObject active = journal.optJSONObject("active");
            if (active != null && !AereaRecordingService.isRecording()) {
                // Recover finalized audio if the Activity or process died before the app imported it.
                long seconds = 0; boolean playable = false;
                MediaMetadataRetriever metadata = new MediaMetadataRetriever();
                try {
                    metadata.setDataSource(store.audio(active.getString("sessionId")).getAbsolutePath());
                    String duration = metadata.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION);
                    if (duration != null) { seconds = Long.parseLong(duration) / 1000; playable = true; }
                } catch (Exception ignored) {} finally { metadata.release(); }
                store.finish(seconds, "Android interrupted the recording. Any playable audio has been saved.", playable);
                journal = store.read(); active = null;
            }
            JSObject result = new JSObject(journal.toString());
            result.put("seconds", AereaRecordingService.seconds());
            result.put("recording", active != null && AereaRecordingService.isRecording());
            call.resolve(result);
        } catch (Exception error) { call.reject("Could not read class recording status", error); }
    }

    @PluginMethod public void startRecording(PluginCall call) {
        if (getPermissionState(MICROPHONE_ALIAS) != PermissionState.GRANTED) { call.reject("Please allow microphone access to record a class."); return; }
        if (getActivity() == null || getActivity().isFinishing()) { call.reject("Open aérea before starting a recording."); return; }
        try {
            JSONObject session = new JSONObject();
            session.put("sessionId", UUID.randomUUID().toString());
            session.put("id", System.currentTimeMillis());
            session.put("startedAt", System.currentTimeMillis());
            session.put("className", call.getString("className", "Class"));
            session.put("classItemId", call.getString("classItemId", ""));
            session.put("name", call.getString("name", "Class recording"));
            session.put("notes", call.getString("notes", ""));
            Intent intent = new Intent(getContext(), AereaRecordingService.class).setAction(AereaRecordingService.START);
            intent.putExtra("session", session.toString());
            intent.putExtra("receiver", receiver(call));
            ContextCompat.startForegroundService(getContext(), intent);
        } catch (Exception error) { call.reject("Could not start class recording", error); }
    }

    @PluginMethod public void stopRecording(PluginCall call) {
        if (!AereaRecordingService.isRecording()) { recordingStatus(call); return; }
        try {
            Intent intent = new Intent(getContext(), AereaRecordingService.class).setAction(AereaRecordingService.STOP);
            intent.putExtra("receiver", receiver(call));
            getContext().startService(intent);
        } catch (Exception error) { call.reject("Could not stop class recording", error); }
    }
    private ResultReceiver receiver(PluginCall call) {
        return new ResultReceiver(new Handler(Looper.getMainLooper())) {
            @Override protected void onReceiveResult(int code, Bundle result) {
                if (code != 0) call.reject(result.getString("error", "Recording failed"));
                else recordingStatus(call);
            }
        };
    }
    @PluginMethod public void acknowledgeRecordings(PluginCall call) {
        try {
            JSArray sessions = call.getArray("sessions", new JSArray());
            AereaRecordingService.store(getContext()).acknowledge(sessions); call.resolve();
        } catch (Exception error) { call.reject("Could not acknowledge saved recordings", error); }
    }
    @PluginMethod public void deleteRecording(PluginCall call) {
        try {
            AereaRecordingService.store(getContext()).delete(call.getString("sessionId", "")); call.resolve();
        } catch (Exception error) { call.reject("Could not delete audio", error); }
    }

    @PluginMethod
    public void status(PluginCall call) {
        JSObject result = new JSObject();
        result.put(
            "permission",
            getPermissionState(MICROPHONE_ALIAS) == PermissionState.GRANTED
                ? "granted"
                : "denied"
        );
        call.resolve(result);
    }

    @PluginMethod
    @Override
    public void requestPermissions(PluginCall call) {
        PermissionState state = getPermissionState(MICROPHONE_ALIAS);

        if (state == PermissionState.GRANTED) {
            status(call);
            return;
        }

        // PROMPT / PROMPT_WITH_RATIONALE can still produce Android's native dialog.
        // DENIED is Capacitor's persisted "denied permanently" state; asking again
        // returns immediately with no UI. In that case, open aérea's app settings
        // so Start recording always gives the user an actionable native screen.
        if (state == PermissionState.DENIED) {
            openAppPermissionSettings();
            status(call);
            return;
        }

        requestPermissionForAlias("microphone", call, "permissionResult");
    }

    @com.getcapacitor.annotation.PermissionCallback
    private void permissionResult(PluginCall call) {
        if (getPermissionState(MICROPHONE_ALIAS) == PermissionState.DENIED) {
            openAppPermissionSettings();
        }
        status(call);
    }

    private void openAppPermissionSettings() {
        if (getActivity() == null) return;

        Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
        intent.setData(Uri.parse("package:" + getContext().getPackageName()));
        getActivity().startActivity(intent);
    }
}
