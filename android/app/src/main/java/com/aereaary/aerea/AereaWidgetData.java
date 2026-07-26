package com.aereaary.aerea;

import android.content.SharedPreferences;
import android.graphics.Color;

import org.json.JSONArray;
import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Locale;

final class AereaWidgetData {
    private AereaWidgetData() {}

    static String dateKey(Calendar date) {
        return new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(date.getTime());
    }

    static JSONObject day(SharedPreferences preferences, Calendar date) {
        String target = dateKey(date);
        try {
            JSONArray days = new JSONArray(preferences.getString("daysJson", "[]"));
            for (int index = 0; index < days.length(); index++) {
                JSONObject day = days.optJSONObject(index);
                if (day != null && target.equals(day.optString("date"))) {
                    return day;
                }
            }
        } catch (Exception ignored) {
            // The widget keeps a sweet empty state while the app syncs again.
        }
        return new JSONObject();
    }

    static JSONArray events(JSONObject day) {
        JSONArray events = day.optJSONArray("events");
        return events == null ? new JSONArray() : events;
    }

    static int eventColor(String color) {
        switch (color) {
            case "emerald":
                return Color.rgb(111, 182, 156);
            case "cyan":
                return Color.rgb(119, 205, 211);
            case "blue":
                return Color.rgb(126, 185, 232);
            case "brown":
                return Color.rgb(185, 159, 146);
            case "black":
                return Color.rgb(111, 107, 114);
            case "red":
                return Color.rgb(233, 120, 120);
            case "rose":
                return Color.rgb(230, 144, 177);
            case "coral":
                return Color.rgb(243, 164, 160);
            case "orange":
                return Color.rgb(239, 188, 101);
            case "yellow":
                return Color.rgb(232, 200, 111);
            case "pink":
                return Color.rgb(234, 183, 201);
            case "lilac":
            default:
                return Color.rgb(174, 150, 216);
        }
    }

    static Calendar shiftedToday(int field, int amount) {
        Calendar date = Calendar.getInstance();
        date.add(field, amount);
        return date;
    }
}
