package com.aereaary.aerea;

import android.app.*;
import android.content.Intent;
import android.content.Context;
import android.content.pm.ServiceInfo;
import android.media.MediaRecorder;
import android.os.*;
import androidx.core.app.NotificationCompat;
import org.json.JSONObject;
import java.io.File;

/** Owns the microphone independently of the Activity and its WebView lifecycle. */
public class AereaRecordingService extends Service {
    static final String START = "aerea.recording.START", STOP = "aerea.recording.STOP";
    private static final String CHANNEL = "aerea-class-recording";
    private static final int NOTIFICATION = 741;
    private static AereaRecordingStore journal;
    private static volatile boolean recording;
    private static volatile boolean starting;
    private MediaRecorder recorder;
    private static volatile long startedElapsed;
    static synchronized AereaRecordingStore store(Context context) {
        if (journal == null) journal = new AereaRecordingStore(new File(context.getFilesDir(), "class-recordings"));
        return journal;
    }
    static boolean isRecording() { return recording || starting; }
    static long seconds() { return recording ? Math.max(0, (SystemClock.elapsedRealtime() - startedElapsed) / 1000) : 0; }
    @Override public IBinder onBind(Intent intent) { return null; }
    @Override public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null) { stopSelf(); return START_NOT_STICKY; }
        ResultReceiver receiver = intent.getParcelableExtra("receiver");
        try {
            if (START.equals(intent.getAction())) {
                if (recording) throw new IllegalStateException("A recording is already running");
                starting = true;
                JSONObject session = new JSONObject(intent.getStringExtra("session"));
                if (Build.VERSION.SDK_INT >= 26) {
                    NotificationChannel channel = new NotificationChannel(CHANNEL, "Class recordings", NotificationManager.IMPORTANCE_LOW);
                    channel.setDescription("Shows when aérea is using your microphone to record a class.");
                    getSystemService(NotificationManager.class).createNotificationChannel(channel);
                }
                Intent open = getPackageManager().getLaunchIntentForPackage(getPackageName());
                PendingIntent content = PendingIntent.getActivity(this, 741, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
                PendingIntent stop = PendingIntent.getService(this, 742, new Intent(this, AereaRecordingService.class).setAction(STOP), PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
                Notification notification = new NotificationCompat.Builder(this, CHANNEL)
                    .setSmallIcon(android.R.drawable.ic_btn_speak_now).setContentTitle("Recording class audio")
                    .setContentText(session.optString("className", "aérea"))
                    .setContentIntent(content).setOngoing(true).setUsesChronometer(true)
                    .setWhen(System.currentTimeMillis()).setCategory(NotificationCompat.CATEGORY_SERVICE)
                    .addAction(android.R.drawable.ic_media_pause, "Stop & save", stop).build();
                if (Build.VERSION.SDK_INT >= 30) startForeground(NOTIFICATION, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE);
                else startForeground(NOTIFICATION, notification);
                AereaRecordingStore store = store(this);
                // Reserve metadata before touching the microphone; a crash cannot create an invisible recording.
                store.start(session);
                recorder = Build.VERSION.SDK_INT >= 31 ? new MediaRecorder(this) : new MediaRecorder();
                recorder.setAudioSource(MediaRecorder.AudioSource.MIC);
                recorder.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4);
                recorder.setAudioEncoder(MediaRecorder.AudioEncoder.AAC);
                recorder.setAudioEncodingBitRate(96000);
                recorder.setAudioSamplingRate(44100);
                recorder.setOutputFile(store.audio(session.getString("sessionId")).getAbsolutePath());
                recorder.setOnErrorListener((source, what, extra) -> finish("Recording was interrupted. Please check microphone access and storage."));
                recorder.prepare(); recorder.start();
                startedElapsed = SystemClock.elapsedRealtime(); recording = true; starting = false;
            } else if (STOP.equals(intent.getAction())) {
                finish(null);
            }
            reply(receiver, null);
        } catch (Exception error) {
            // A duplicate start must never stop the original session.
            if (!recording) { starting = false; release(); try { store(this).finish(0, "Could not start recording. Check microphone access and available storage.", false); } catch (Exception ignored) {} stopForeground(STOP_FOREGROUND_REMOVE); stopSelf(); }
            reply(receiver, error.getMessage());
        }
        return START_NOT_STICKY;
    }
    private void reply(ResultReceiver receiver, String error) {
        if (receiver == null) return;
        Bundle result = new Bundle();
        if (error != null) result.putString("error", error);
        receiver.send(error == null ? 0 : 1, result);
    }
    private void release() { if (recorder != null) { recorder.release(); recorder = null; } }
    private void finish(String error) {
        if (!recording) { stopSelf(); return; }
        boolean playable = false;
        long seconds = Math.max(0, (SystemClock.elapsedRealtime() - startedElapsed) / 1000);
        try { recorder.stop(); playable = true; }
        catch (RuntimeException stopped) { error = "No playable audio was captured. Try recording again."; }
        finally { release(); }
        try { store(this).finish(seconds, error, playable); }
        catch (Exception failedSave) { /* Keep the active journal and audio for recovery on the next launch. */ }
        recording = false;
        stopForeground(STOP_FOREGROUND_REMOVE); stopSelf();
    }
    @Override public void onDestroy() { finish("Recording ended when Android closed the service."); super.onDestroy(); }
}
