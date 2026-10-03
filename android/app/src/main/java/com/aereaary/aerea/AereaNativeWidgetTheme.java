package com.aereaary.aerea;

import android.content.SharedPreferences;
import android.widget.RemoteViews;

/** Opt-in palettes; returns without touching any legacy widget. */
final class AereaNativeWidgetTheme {
    static boolean isNativeTheme(String theme) {
        return "samsungminimal".equals(theme) || "samsungao3".equals(theme);
    }
    static int ink(String theme, boolean dark) {
        return !dark ? 0xFF161616 : "samsungao3".equals(theme) ? 0xFFDFDBEC : 0xFFF3F3F3;
    }
    static int background(String theme, boolean dark) {
        if (!dark) return R.drawable.widget_native_light;
        return "samsungao3".equals(theme) ? R.drawable.widget_native_ao3 : R.drawable.widget_native_dark;
    }
    static int accent(String theme, boolean dark) {
        if ("samsungao3".equals(theme)) return dark ? 0xFFF4BFD7 : 0xFF913D66;
        return dark ? 0xFFA294F9 : 0xFF6552A9;
    }
    static void apply(RemoteViews views, SharedPreferences prefs, boolean month) {
        String theme = AereaWidgetData.safeString(prefs, "theme", "storybook");
        if (!isNativeTheme(theme)) return;
        boolean dark = "dark".equals(AereaWidgetData.safeString(prefs, "colorMode", "light"));
        views.setInt(month ? R.id.month_widget_root : R.id.widget_root,
            "setBackgroundResource", background(theme, dark));
        int[] labels = month ? new int[]{R.id.month_widget_today, R.id.month_widget_previous,
            R.id.month_widget_title, R.id.month_widget_next, R.id.month_widget_selected_date,
            R.id.month_widget_event_time_1, R.id.month_widget_event_time_2,
            R.id.month_widget_event_title_1, R.id.month_widget_event_title_2,
            R.id.month_widget_event_face_1, R.id.month_widget_event_face_2}
            : new int[]{R.id.widget_today, R.id.widget_previous, R.id.widget_date,
            R.id.widget_temperature, R.id.widget_next, R.id.widget_progress,
            R.id.widget_event_time_1, R.id.widget_event_time_2,
            R.id.widget_event_title_1, R.id.widget_event_title_2,
            R.id.widget_event_face_1, R.id.widget_event_face_2};
        for (int id : labels) views.setTextColor(id, ink(theme, dark));
        if (month) {
            int[] weekdays = {R.id.month_weekday_sun, R.id.month_weekday_mon,
                R.id.month_weekday_tue, R.id.month_weekday_wed, R.id.month_weekday_thu,
                R.id.month_weekday_fri, R.id.month_weekday_sat};
            for (int i = 0; i < weekdays.length; i++) {
                views.setTextColor(weekdays[i], i == 0 || i == 6
                    ? accent(theme, dark) : ink(theme, dark));
            }
        }
        int[] actions = month ? new int[]{R.id.month_widget_previous,R.id.month_widget_next,R.id.month_widget_add}
            : new int[]{R.id.widget_previous,R.id.widget_next,R.id.widget_add};
        for (int id : actions) {
            views.setInt(id,"setBackgroundResource", R.drawable.widget_native_action);
            views.setTextColor(id, accent(theme, dark));
        }
    }
}
