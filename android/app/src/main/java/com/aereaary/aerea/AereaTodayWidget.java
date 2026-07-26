package com.aereaary.aerea;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.view.View;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Locale;

public class AereaTodayWidget extends AppWidgetProvider {
    private static final String ACTION_PREVIOUS =
        "com.aereaary.aerea.widget.AGENDA_PREVIOUS";
    private static final String ACTION_NEXT =
        "com.aereaary.aerea.widget.AGENDA_NEXT";
    private static final String ACTION_TODAY =
        "com.aereaary.aerea.widget.AGENDA_TODAY";
    private static final String EXTRA_WIDGET_ID = "aereaWidgetId";

    @Override
    public void onUpdate(
        Context context,
        AppWidgetManager appWidgetManager,
        int[] appWidgetIds
    ) {
        for (int appWidgetId : appWidgetIds) {
            updateWidget(context, appWidgetManager, appWidgetId);
        }
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        String action = intent.getAction();
        if (
            !ACTION_PREVIOUS.equals(action) &&
            !ACTION_NEXT.equals(action) &&
            !ACTION_TODAY.equals(action)
        ) {
            return;
        }

        int widgetId = intent.getIntExtra(
            EXTRA_WIDGET_ID,
            AppWidgetManager.INVALID_APPWIDGET_ID
        );
        if (widgetId == AppWidgetManager.INVALID_APPWIDGET_ID) return;

        SharedPreferences preferences = context.getSharedPreferences(
            AereaWidgetPlugin.PREFERENCES,
            Context.MODE_PRIVATE
        );
        String offsetKey = "agendaOffset_" + widgetId;
        int offset = preferences.getInt(offsetKey, 0);
        if (ACTION_PREVIOUS.equals(action)) offset -= 1;
        if (ACTION_NEXT.equals(action)) offset += 1;
        if (ACTION_TODAY.equals(action)) offset = 0;
        preferences.edit().putInt(offsetKey, offset).apply();
        updateWidget(context, AppWidgetManager.getInstance(context), widgetId);
    }

    static void updateAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        ComponentName component = new ComponentName(context, AereaTodayWidget.class);
        int[] ids = manager.getAppWidgetIds(component);
        for (int id : ids) {
            updateWidget(context, manager, id);
        }
    }

    private static void updateWidget(
        Context context,
        AppWidgetManager manager,
        int appWidgetId
    ) {
        SharedPreferences preferences = context.getSharedPreferences(
            AereaWidgetPlugin.PREFERENCES,
            Context.MODE_PRIVATE
        );
        int offset = preferences.getInt("agendaOffset_" + appWidgetId, 0);
        Calendar selectedDate = AereaWidgetData.shiftedToday(Calendar.DAY_OF_MONTH, offset);
        JSONObject day = AereaWidgetData.day(preferences, selectedDate);
        JSONArray events = AereaWidgetData.events(day);
        String theme = preferences.getString("theme", "storybook");

        RemoteViews views = new RemoteViews(
            context.getPackageName(),
            R.layout.aerea_today_widget
        );
        views.setInt(
            R.id.widget_root,
            "setBackgroundResource",
            "otter".equals(theme)
                ? R.drawable.widget_background_lavender
                : R.drawable.widget_background_cloudberry
        );
        views.setTextViewText(
            R.id.widget_today,
            offset == 0 ? "Hoy" : "Volver a hoy"
        );
        views.setTextViewText(
            R.id.widget_date,
            new SimpleDateFormat("EEE, d MMM", new Locale("es"))
                .format(selectedDate.getTime())
        );
        views.setTextViewText(
            R.id.widget_temperature,
            offset == 0 ? preferences.getString("temperature", "—°") : ""
        );
        views.setTextViewText(
            R.id.widget_progress,
            offset == 0
                ? preferences.getString("progress", "0/3 recordatorios")
                : day.optBoolean("complete", false)
                    ? "día completado ✓"
                    : ""
        );
        views.setViewVisibility(
            R.id.widget_progress,
            offset == 0 || day.optBoolean("complete", false)
                ? View.VISIBLE
                : View.GONE
        );

        bindEvent(views, events.optJSONObject(0), 1, day.optString("mood"));
        bindEvent(views, events.optJSONObject(1), 2, day.optString("mood"));

        views.setOnClickPendingIntent(
            R.id.widget_previous,
            actionIntent(context, appWidgetId, ACTION_PREVIOUS, 1)
        );
        views.setOnClickPendingIntent(
            R.id.widget_next,
            actionIntent(context, appWidgetId, ACTION_NEXT, 2)
        );
        views.setOnClickPendingIntent(
            R.id.widget_today,
            actionIntent(context, appWidgetId, ACTION_TODAY, 3)
        );
        PendingIntent openApp = openAppIntent(context, appWidgetId);
        views.setOnClickPendingIntent(R.id.widget_add, openApp);
        views.setOnClickPendingIntent(R.id.widget_event_row_1, openApp);
        views.setOnClickPendingIntent(R.id.widget_event_row_2, openApp);
        manager.updateAppWidget(appWidgetId, views);
    }

    private static void bindEvent(
        RemoteViews views,
        JSONObject event,
        int row,
        String mood
    ) {
        int containerId = row == 1 ? R.id.widget_event_row_1 : R.id.widget_event_row_2;
        int timeId = row == 1 ? R.id.widget_event_time_1 : R.id.widget_event_time_2;
        int titleId = row == 1 ? R.id.widget_event_title_1 : R.id.widget_event_title_2;
        int faceId = row == 1 ? R.id.widget_event_face_1 : R.id.widget_event_face_2;
        int barId = row == 1 ? R.id.widget_event_bar_1 : R.id.widget_event_bar_2;

        if (event == null) {
            if (row == 1) {
                views.setViewVisibility(containerId, View.VISIBLE);
                views.setTextViewText(timeId, "");
                views.setTextViewText(titleId, "Un día suave, sin eventos ♡");
                views.setTextViewText(faceId, mood.isEmpty() ? "☁" : mood);
                views.setInt(barId, "setBackgroundColor", 0xFF9FD8EB);
            } else {
                views.setViewVisibility(containerId, View.GONE);
            }
            return;
        }

        views.setViewVisibility(containerId, View.VISIBLE);
        views.setTextViewText(timeId, event.optString("time", ""));
        views.setTextViewText(titleId, event.optString("title", "Algo bonito"));
        views.setTextViewText(faceId, mood.isEmpty() ? "✦" : mood);
        views.setInt(
            barId,
            "setBackgroundColor",
            AereaWidgetData.eventColor(event.optString("color", "lilac"))
        );
    }

    private static PendingIntent actionIntent(
        Context context,
        int widgetId,
        String action,
        int suffix
    ) {
        Intent intent = new Intent(context, AereaTodayWidget.class);
        intent.setAction(action);
        intent.putExtra(EXTRA_WIDGET_ID, widgetId);
        return PendingIntent.getBroadcast(
            context,
            widgetId * 10 + suffix,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
    }

    private static PendingIntent openAppIntent(Context context, int widgetId) {
        Intent launchIntent = new Intent(context, MainActivity.class);
        launchIntent.setAction("com.aereaary.aerea.OPEN_CALENDAR");
        return PendingIntent.getActivity(
            context,
            widgetId,
            launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
    }
}
