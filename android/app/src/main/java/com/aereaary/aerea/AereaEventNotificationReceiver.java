package com.aereaary.aerea;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import androidx.core.app.NotificationCompat;

public class AereaEventNotificationReceiver extends BroadcastReceiver {
    static final String CHANNEL_ID = "aerea_event_reminders";

    @Override public void onReceive(Context context, Intent intent) {
        NotificationManager manager = context.getSystemService(NotificationManager.class);
        NotificationChannel channel = new NotificationChannel(
            CHANNEL_ID, "Recordatorios de eventos", NotificationManager.IMPORTANCE_HIGH);
        channel.setDescription("Avisos de eventos guardados en aérea");
        manager.createNotificationChannel(channel);
        Intent launch = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        PendingIntent content = PendingIntent.getActivity(context, 0, launch, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        String identity = intent.getStringExtra("identity");
        String title = intent.getStringExtra("title");
        String when = intent.getStringExtra("when");
        manager.notify(identity.hashCode(), new NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_notification_aerea)
            .setContentTitle(title == null ? "Evento de aérea" : title)
            .setContentText(when == null ? "Tu evento comienza pronto" : when)
            .setAutoCancel(true).setContentIntent(content).setPriority(NotificationCompat.PRIORITY_HIGH).build());
    }
}
