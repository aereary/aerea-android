package com.aereaary.aerea;

import android.content.Context;
import android.content.SharedPreferences;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "AereaWidget")
public class AereaWidgetPlugin extends Plugin {
    static final String PREFERENCES = "aerea_widget";

    @PluginMethod
    public void sync(PluginCall call) {
        try {
            SharedPreferences.Editor editor = getContext()
                .getSharedPreferences(PREFERENCES, Context.MODE_PRIVATE)
                .edit();

            editor.putString("date", call.getString("date", ""));
            editor.putString(
                "eventTitle",
                call.getString("eventTitle", "No events yet ♡")
            );
            editor.putString(
                "eventTime",
                call.getString("eventTime", "Open aérea to plan")
            );
            editor.putString("temperature", call.getString("temperature", "♡"));
            editor.putString(
                "progress",
                call.getString("progress", "No events yet ♡")
            );
            editor.putString("theme", call.getString("theme", "storybook"));
            editor.putString("daysJson", call.getString("daysJson", "[]"));
            editor.apply();
        } catch (RuntimeException ignored) {
            // Defaults in each provider keep both widgets renderable.
        }

        try {
            AereaTodayWidget.updateAll(getContext());
            AereaMonthWidget.updateAll(getContext());
        } catch (RuntimeException ignored) {
            // Never fail the bridge call because of a launcher implementation.
        }
        call.resolve(new JSObject());
    }
}
