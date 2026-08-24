package com.aereaary.aerea;

import android.content.Context;
import android.content.SharedPreferences;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "AereaAuth")
public class AereaAuthPlugin extends Plugin {
    private static final String PREFS = "aerea_auth";
    private static final String KEY_PENDING_URL = "pending_url";

    public static void storePendingUrl(Context context, String url) {
        if (url == null || url.isEmpty()) return;
        context
            .getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit()
            .putString(KEY_PENDING_URL, url)
            .apply();
    }

    @PluginMethod
    public void takePendingUrl(PluginCall call) {
        SharedPreferences preferences =
            getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);

        String url = preferences.getString(KEY_PENDING_URL, null);
        if (url != null) {
            preferences.edit().remove(KEY_PENDING_URL).apply();
        }

        JSObject result = new JSObject();
        if (url != null) {
            result.put("url", url);
        }
        call.resolve(result);
    }
}
