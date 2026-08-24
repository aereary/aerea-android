package com.aereaary.aerea;

import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

import androidx.core.app.NotificationCompat;

public class AereaSportsNotificationReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        AereaSportsNotificationsPlugin.createChannel(context);
        int id = intent.getIntExtra("notification_id", 9021);
        Intent openApp = new Intent(context, MainActivity.class)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent contentIntent = PendingIntent.getActivity(
                context,
                id,
                openApp,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        NotificationCompat.Builder notification = new NotificationCompat.Builder(
                context,
                AereaSportsNotificationsPlugin.CHANNEL_ID
        )
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle(intent.getStringExtra("title"))
                .setContentText(intent.getStringExtra("body"))
                .setStyle(new NotificationCompat.BigTextStyle().bigText(intent.getStringExtra("body")))
                .setContentIntent(contentIntent)
                .setAutoCancel(true)
                .setCategory(NotificationCompat.CATEGORY_EVENT);
        NotificationManager manager =
                (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        try {
            manager.notify(id, notification.build());
        } catch (SecurityException ignored) {
            // The user may have declined notifications after an alarm was set.
        }
    }
}
