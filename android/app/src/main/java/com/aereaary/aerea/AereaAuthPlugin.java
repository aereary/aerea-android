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
    static final String EVENT_NAME = "aereaAuthLink";
    private static final String PREFERENCES = "aerea_auth";
    private static final String PENDING_LINK = "pending_link";

    static void storePendingLink(Context context, String url) {
        if (url == null || url.isBlank()) return;
        context.getSharedPreferences(PREFERENCES, Context.MODE_PRIVATE)
            .edit()
            .putString(PENDING_LINK, url)
            .apply();
    }

    @PluginMethod
    public void getPendingLink(PluginCall call) {
        SharedPreferences preferences = getContext().getSharedPreferences(
            PREFERENCES,
            Context.MODE_PRIVATE
        );
        String url;
        try {
            url = preferences.getString(PENDING_LINK, null);
        } catch (ClassCastException ignored) {
            url = null;
        }
        preferences.edit().remove(PENDING_LINK).apply();

        JSObject result = new JSObject();
        result.put("url", url);
        call.resolve(result);
    }
}
