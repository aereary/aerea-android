package com.aereaary.aerea;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;

public class AereaSportsBootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (!Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())) return;
        SharedPreferences preferences = context.getSharedPreferences(
                AereaSportsNotificationsPlugin.PREFS,
                Context.MODE_PRIVATE
        );
        try {
            AereaSportsNotificationsPlugin.schedule(
                    context,
                    preferences.getString("events_json", "[]"),
                    preferences.getBoolean("enabled", false),
                    preferences.getInt("lead_minutes", 60),
                    false
            );
        } catch (Exception ignored) {
            // The next app launch will safely rebuild the schedule.
        }
    }
}
