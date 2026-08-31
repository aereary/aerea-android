package com.aereaary.aerea;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class AereaEventRescheduleReceiver extends BroadcastReceiver {
    @Override public void onReceive(Context context, Intent intent) {
        AereaEventNotificationsPlugin.rescheduleStored(context);
    }
}
