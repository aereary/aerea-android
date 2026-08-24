package com.aereaary.aerea;

import android.Manifest;
import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.HashSet;
import java.util.Set;

@CapacitorPlugin(
        name = "AereaSportsNotifications",
        permissions = @Permission(
                alias = "notifications",
                strings = { Manifest.permission.POST_NOTIFICATIONS }
        )
)
public class AereaSportsNotificationsPlugin extends Plugin {
    static final String PREFS = "aerea_sports_notifications";
    static final String CHANNEL_ID = "aerea_match_day";

    @PluginMethod
    public void sync(PluginCall call) {
        String eventsJson = call.getString("eventsJson", "[]");
        boolean enabled = Boolean.TRUE.equals(call.getBoolean("enabled", false));
        int leadMinutes = Math.max(0, call.getInt("leadMinutes", 60));
        try {
            schedule(getContext(), eventsJson, enabled, leadMinutes, true);
            call.resolve();
        } catch (Exception error) {
            call.reject("Could not schedule match notifications", error);
        }
    }

    static void schedule(
            Context context,
            String eventsJson,
            boolean enabled,
            int leadMinutes,
            boolean persist
    ) throws Exception {
        createChannel(context);
        SharedPreferences preferences = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        Set<String> previousIds = preferences.getStringSet("request_codes", new HashSet<>());
        for (String value : previousIds) {
            int requestCode = Integer.parseInt(value);
            alarmManager.cancel(notificationIntent(context, requestCode, null));
        }

        Set<String> scheduledIds = new HashSet<>();
        if (enabled) {
            JSONArray events = new JSONArray(eventsJson);
            long now = System.currentTimeMillis();
            for (int index = 0; index < events.length(); index++) {
                JSONObject event = events.getJSONObject(index);
                if (!"scheduled".equals(event.optString("status"))) continue;
                long startsAt = event.optLong("startsAt", 0L);
                long alarmAt = startsAt - (leadMinutes * 60_000L);
                if (alarmAt <= now) continue;
                String externalId = event.optString("externalId", String.valueOf(index));
                int requestCode = externalId.hashCode() & 0x7fffffff;
                String team = event.optString("team", "Your team");
                String opponent = event.optString("opponent", "their next rival");
                String time = event.optString("time", "");
                String title = event.optString("icon", "") + " " + team + " plays soon";
                String body = "Match day · " + team + " vs " + opponent +
                        (time.isEmpty() ? "" : " · " + time);
                Intent notification = new Intent(context, AereaSportsNotificationReceiver.class)
                        .putExtra("title", title.trim())
                        .putExtra("body", body)
                        .putExtra("notification_id", requestCode);
                PendingIntent pendingIntent = notificationIntent(context, requestCode, notification);
                alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, alarmAt, pendingIntent);
                scheduledIds.add(String.valueOf(requestCode));
            }
        }

        SharedPreferences.Editor editor = preferences.edit()
                .putStringSet("request_codes", scheduledIds);
        if (persist) {
            editor.putString("events_json", eventsJson)
                    .putBoolean("enabled", enabled)
                    .putInt("lead_minutes", leadMinutes);
        }
        editor.apply();
    }

    private static PendingIntent notificationIntent(
            Context context,
            int requestCode,
            Intent source
    ) {
        Intent intent = source == null
                ? new Intent(context, AereaSportsNotificationReceiver.class)
                : source;
        return PendingIntent.getBroadcast(
                context,
                requestCode,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
    }

    static void createChannel(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager manager =
                (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Match day",
                NotificationManager.IMPORTANCE_DEFAULT
        );
        channel.setDescription("Gentle reminders before followed teams play");
        manager.createNotificationChannel(channel);
    }
}
