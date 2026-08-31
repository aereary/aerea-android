package com.aereaary.aerea;

import android.Manifest;
import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import org.json.JSONArray;
import org.json.JSONObject;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.HashSet;
import java.util.Set;

@CapacitorPlugin(name="AereaEventNotifications", permissions={
    @Permission(alias="notifications", strings={Manifest.permission.POST_NOTIFICATIONS})
})
public class AereaEventNotificationsPlugin extends Plugin {
    static final String PREFS = "aerea_event_notification_schedule";
    static final String EVENTS = "events_json";
    static final int HORIZON_DAYS = 370;

    @PluginMethod public void status(PluginCall call) {
        NotificationManager manager = getContext().getSystemService(NotificationManager.class);
        boolean permission = Build.VERSION.SDK_INT < 33 || ContextCompat.checkSelfPermission(getContext(), Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED;
        NotificationChannel channel = manager.getNotificationChannel(AereaEventNotificationReceiver.CHANNEL_ID);
        JSObject result = new JSObject();
        result.put("permission", permission ? "granted" : "denied");
        result.put("channel", channel != null && channel.getImportance() == NotificationManager.IMPORTANCE_NONE ? "blocked" : "available");
        result.put("exact", canExact(getContext()));
        call.resolve(result);
    }

    @PluginMethod public void requestPermissions(PluginCall call) {
        if (Build.VERSION.SDK_INT < 33) { status(call); return; }
        requestPermissionForAlias("notifications", call, "permissionResult");
    }

    @com.getcapacitor.annotation.PermissionCallback
    private void permissionResult(PluginCall call) { status(call); }

    @PluginMethod public void openSettings(PluginCall call) {
        Intent intent = new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS)
            .putExtra(Settings.EXTRA_APP_PACKAGE, getContext().getPackageName())
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(intent); call.resolve();
    }

    @PluginMethod public void sync(PluginCall call) {
        String json = call.getString("eventsJson", "[]");
        try {
            getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString(EVENTS, json).apply();
            int count = scheduleJson(getContext(), json);
            JSObject result = new JSObject(); result.put("scheduled", count); result.put("exact", canExact(getContext())); call.resolve(result);
        } catch (Exception error) { call.reject("No se pudieron programar los recordatorios", error); }
    }

    /** Explicit QA hook: schedules one ephemeral notification and stores no demo event. */
    @PluginMethod public void scheduleQaNotification(PluginCall call) {
        int seconds = Math.max(3, Math.min(30, call.getInt("delaySeconds", 5)));
        String identity = "qa:" + System.currentTimeMillis();
        long trigger = System.currentTimeMillis() + seconds * 1000L;
        AlarmManager alarms = getContext().getSystemService(AlarmManager.class);
        PendingIntent intent = pending(getContext(), identity, "Prueba de notificación de aérea", trigger, PendingIntent.FLAG_UPDATE_CURRENT);
        if (canExact(getContext())) alarms.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, trigger, intent);
        else alarms.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, trigger, intent);
        JSObject result = new JSObject(); result.put("identity", identity); result.put("firesInSeconds", seconds); call.resolve(result);
    }

    static void rescheduleStored(Context context) {
        String json = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(EVENTS, "[]");
        try { scheduleJson(context, json); } catch (Exception ignored) { android.util.Log.e("aerea", "Could not restore event reminders", ignored); }
    }

    static int scheduleJson(Context context, String json) throws Exception {
        AlarmManager alarms = context.getSystemService(AlarmManager.class);
        Set<String> oldIds = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getStringSet("identities", new HashSet<>());
        for (String id : oldIds) {
            PendingIntent existing = pending(context, id, null, 0, PendingIntent.FLAG_NO_CREATE);
            if (existing != null) alarms.cancel(existing);
        }
        Set<String> nextIds = new HashSet<>(); int count = 0; long now = System.currentTimeMillis();
        JSONArray events = new JSONArray(json);
        for (int i=0; i<events.length(); i++) {
            JSONObject event = events.getJSONObject(i); int lead = leadMinutes(event.optString("reminder"));
            if (lead < 0 || event.optString("date").isEmpty()) continue;
            LocalDate start = LocalDate.parse(event.getString("date")); LocalDate end = start.plusDays(HORIZON_DAYS);
            String until = event.optString("repeatUntil"); if (!until.isEmpty()) end = min(end, LocalDate.parse(until));
            String repeat = event.optString("repeat", "Never"); JSONArray excluded = event.optJSONArray("excludedDates");
            for (LocalDate day=start; !day.isAfter(end); day=day.plusDays(1)) {
                if (!occurs(event, start, day, repeat) || contains(excluded, day.toString())) continue;
                String time = event.optBoolean("allDay", false) ? "00:00" : event.optString("time", "00:00");
                long trigger = LocalDateTime.parse(day + "T" + normalizeTime(time)).atZone(ZoneId.systemDefault()).toInstant().toEpochMilli() - lead * 60000L;
                if (trigger <= now) continue;
                String identity = event.getString("id") + ":" + day; nextIds.add(identity);
                PendingIntent pi = pending(context, identity, event.optString("title", "Evento de aérea"), trigger, PendingIntent.FLAG_UPDATE_CURRENT);
                if (canExact(context)) alarms.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, trigger, pi);
                else alarms.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, trigger, pi);
                count++; if ("Never".equals(repeat)) break;
            }
        }
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putStringSet("identities", nextIds).apply(); return count;
    }

    static PendingIntent pending(Context c, String id, String title, long trigger, int mode) {
        Intent intent = new Intent(c, AereaEventNotificationReceiver.class).setAction("aerea.event."+id)
            .putExtra("identity", id).putExtra("title", title).putExtra("when", "Tu evento comienza pronto");
        PendingIntent result = PendingIntent.getBroadcast(c, id.hashCode(), intent, PendingIntent.FLAG_IMMUTABLE | mode);
        return result;
    }
    static boolean canExact(Context c) { AlarmManager a=c.getSystemService(AlarmManager.class); return Build.VERSION.SDK_INT < 31 || a.canScheduleExactAlarms(); }
    static int leadMinutes(String value) { switch(value.toLowerCase()) { case "at start time": return 0; case "10 minutes before": return 10; case "30 minutes before": return 30; case "1 hour before": return 60; case "1 day before": return 1440; default:return -1; } }
    static boolean contains(JSONArray values,String value){ if(values==null)return false; for(int i=0;i<values.length();i++)if(value.equals(values.optString(i)))return true; return false; }
    static boolean occurs(JSONObject event,LocalDate start,LocalDate day,String repeat){ long d=ChronoUnit.DAYS.between(start,day); if(d<0)return false; if("Never".equals(repeat))return d==0; if("Daily".equals(repeat))return true; if("Weekly".equals(repeat))return d%7==0; if("Monthly".equals(repeat))return day.getDayOfMonth()==start.getDayOfMonth(); if("Yearly".equals(repeat))return day.getDayOfMonth()==start.getDayOfMonth()&&day.getMonth()==start.getMonth(); int every=Math.max(1,event.optInt("customRepeatEvery",1)); String unit=event.optString("customRepeatUnit","weeks"); if("days".equals(unit))return d%every==0; if("months".equals(unit)){long months=ChronoUnit.MONTHS.between(start.withDayOfMonth(1),day.withDayOfMonth(1));return months%every==0&&day.getDayOfMonth()==start.getDayOfMonth();} return d%(every*7L)==0; }
    static LocalDate min(LocalDate a,LocalDate b){return a.isBefore(b)?a:b;}
    static String normalizeTime(String value){ return value.matches("\\d{2}:\\d{2}")?value:value+":00"; }
}
