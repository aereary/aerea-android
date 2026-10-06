package com.aereaary.aerea;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import java.io.File;

public class AereaUpdateCleanupReceiver extends BroadcastReceiver {
    static File directory(Context context) {
        return new File(context.getCacheDir(), "aerea-updates");
    }

    static void clear(Context context) {
        File directory = directory(context);
        // Only the updater's own fixed files; never planner/library data or other cache.
        for (String name : new String[]{"update.apk", "update.part.apk", "ready.json"}) {
            new File(directory, name).delete();
        }
        directory.delete();
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        if (Intent.ACTION_MY_PACKAGE_REPLACED.equals(intent.getAction())) clear(context);
    }
}
