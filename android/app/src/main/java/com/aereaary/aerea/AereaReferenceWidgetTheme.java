package com.aereaary.aerea;

import android.content.SharedPreferences;
import android.widget.RemoteViews;

/** Opt-in palettes; returns without touching any legacy widget. */
final class AereaReferenceWidgetTheme {
    static boolean isReference(String theme) {
        return "astralnight".equals(theme) || "blushcards".equals(theme)
            || "pastellayers".equals(theme) || "pasteljourney".equals(theme);
    }
    static int ink(String theme, boolean dark) {
        return dark || "astralnight".equals(theme) ? 0xFFF8EFFF : 0xFF30283F;
    }
    static int background(String theme, boolean dark) {
        if (dark && !"astralnight".equals(theme)) return R.drawable.widget_reference_dark;
        switch (theme) {
            case "astralnight": return R.drawable.widget_reference_astralnight;
            case "blushcards": return R.drawable.widget_reference_blushcards;
            case "pastellayers": return R.drawable.widget_reference_pastellayers;
            default: return R.drawable.widget_reference_pasteljourney;
        }
    }
    static void apply(RemoteViews views, SharedPreferences prefs, boolean month) {
        String theme = AereaWidgetData.safeString(prefs, "theme", "storybook");
        if (!isReference(theme)) return;
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
        int[] actions = month ? new int[]{R.id.month_widget_previous,R.id.month_widget_next,R.id.month_widget_add}
            : new int[]{R.id.widget_previous,R.id.widget_next,R.id.widget_add};
        for (int id : actions) {
            views.setInt(id,"setBackgroundResource", R.drawable.widget_reference_action);
            views.setTextColor(id, 0xFF40304F);
        }
    }
}
