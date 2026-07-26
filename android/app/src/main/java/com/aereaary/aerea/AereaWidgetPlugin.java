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
        SharedPreferences.Editor editor = getContext()
            .getSharedPreferences(PREFERENCES, Context.MODE_PRIVATE)
            .edit();

        editor.putString("date", call.getString("date", ""));
        editor.putString("eventTitle", call.getString("eventTitle", "Sin eventos para hoy"));
        editor.putString("eventTime", call.getString("eventTime", "Abre aérea para planear"));
        editor.putString("temperature", call.getString("temperature", "—°"));
        editor.putString("progress", call.getString("progress", "0/3 recordatorios"));
        editor.putString("theme", call.getString("theme", "storybook"));
        editor.putString("daysJson", call.getString("daysJson", "[]"));
        editor.apply();

        AereaTodayWidget.updateAll(getContext());
        AereaMonthWidget.updateAll(getContext());
        call.resolve(new JSObject());
    }
}
