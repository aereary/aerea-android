package com.aereaary.aerea;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.view.View;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Locale;

public class AereaMonthWidget extends AppWidgetProvider {
    static final String EXTRA_YEAR = "aereaYear";
    static final String EXTRA_MONTH = "aereaMonth";
    private static final String EXTRA_WIDGET_ID = "aereaWidgetId";
    private static final String ACTION_PREVIOUS =
        "com.aereaary.aerea.widget.MONTH_PREVIOUS";
    private static final String ACTION_NEXT =
        "com.aereaary.aerea.widget.MONTH_NEXT";
    private static final String ACTION_TODAY =
        "com.aereaary.aerea.widget.MONTH_TODAY";

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
        String offsetKey = "monthOffset_" + widgetId;
        int offset = preferences.getInt(offsetKey, 0);
        if (ACTION_PREVIOUS.equals(action)) offset -= 1;
        if (ACTION_NEXT.equals(action)) offset += 1;
        if (ACTION_TODAY.equals(action)) offset = 0;
        preferences.edit().putInt(offsetKey, offset).apply();
        updateWidget(context, AppWidgetManager.getInstance(context), widgetId);
    }

    static void updateAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        ComponentName component = new ComponentName(context, AereaMonthWidget.class);
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
        int offset = preferences.getInt("monthOffset_" + appWidgetId, 0);
        Calendar month = Calendar.getInstance();
        month.set(Calendar.DAY_OF_MONTH, 1);
        month.add(Calendar.MONTH, offset);
        String theme = preferences.getString("theme", "storybook");

        RemoteViews views = new RemoteViews(
            context.getPackageName(),
            R.layout.aerea_month_widget
        );
        views.setInt(
            R.id.month_widget_root,
            "setBackgroundResource",
            "otter".equals(theme)
                ? R.drawable.widget_background_lavender
                : R.drawable.widget_background_cloudberry
        );
        views.setTextViewText(
            R.id.month_widget_title,
            capitalize(
                new SimpleDateFormat("MMMM yyyy", new Locale("es"))
                    .format(month.getTime())
            )
        );
        views.setTextViewText(
            R.id.month_widget_today,
            offset == 0 ? "Hoy" : "Volver"
        );

        Intent adapterIntent = new Intent(context, AereaMonthGridService.class);
        adapterIntent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId);
        adapterIntent.putExtra(EXTRA_YEAR, month.get(Calendar.YEAR));
        adapterIntent.putExtra(EXTRA_MONTH, month.get(Calendar.MONTH));
        adapterIntent.setData(Uri.parse(adapterIntent.toUri(Intent.URI_INTENT_SCHEME)));
        views.setRemoteAdapter(R.id.month_widget_grid, adapterIntent);

        PendingIntent openApp = openAppIntent(context, appWidgetId);
        views.setPendingIntentTemplate(R.id.month_widget_grid, openApp);
        views.setOnClickPendingIntent(R.id.month_widget_add, openApp);
        views.setOnClickPendingIntent(R.id.month_widget_event_row_1, openApp);
        views.setOnClickPendingIntent(R.id.month_widget_event_row_2, openApp);
        views.setOnClickPendingIntent(
            R.id.month_widget_previous,
            actionIntent(context, appWidgetId, ACTION_PREVIOUS, 1)
        );
        views.setOnClickPendingIntent(
            R.id.month_widget_next,
            actionIntent(context, appWidgetId, ACTION_NEXT, 2)
        );
        views.setOnClickPendingIntent(
            R.id.month_widget_today,
            actionIntent(context, appWidgetId, ACTION_TODAY, 3)
        );

        Calendar agendaDate = agendaDateForMonth(preferences, month, offset);
        JSONObject agendaDay = AereaWidgetData.day(preferences, agendaDate);
        JSONArray events = AereaWidgetData.events(agendaDay);
        views.setTextViewText(
            R.id.month_widget_selected_date,
            offset == 0
                ? "HOY · " + new SimpleDateFormat("d MMM", new Locale("es"))
                    .format(agendaDate.getTime()).toUpperCase(new Locale("es"))
                : new SimpleDateFormat("EEE d MMM", new Locale("es"))
                    .format(agendaDate.getTime()).toUpperCase(new Locale("es"))
        );
        bindEvent(views, events.optJSONObject(0), 1, agendaDay.optString("mood"));
        bindEvent(views, events.optJSONObject(1), 2, agendaDay.optString("mood"));

        manager.updateAppWidget(appWidgetId, views);
        manager.notifyAppWidgetViewDataChanged(appWidgetId, R.id.month_widget_grid);
    }

    private static Calendar agendaDateForMonth(
        SharedPreferences preferences,
        Calendar month,
        int offset
    ) {
        if (offset == 0) return Calendar.getInstance();
        Calendar candidate = (Calendar) month.clone();
        int days = candidate.getActualMaximum(Calendar.DAY_OF_MONTH);
        for (int day = 1; day <= days; day++) {
            candidate.set(Calendar.DAY_OF_MONTH, day);
            if (AereaWidgetData.events(AereaWidgetData.day(preferences, candidate)).length() > 0) {
                return (Calendar) candidate.clone();
            }
        }
        candidate.set(Calendar.DAY_OF_MONTH, 1);
        return candidate;
    }

    private static void bindEvent(
        RemoteViews views,
        JSONObject event,
        int row,
        String mood
    ) {
        int containerId = row == 1
            ? R.id.month_widget_event_row_1
            : R.id.month_widget_event_row_2;
        int timeId = row == 1
            ? R.id.month_widget_event_time_1
            : R.id.month_widget_event_time_2;
        int titleId = row == 1
            ? R.id.month_widget_event_title_1
            : R.id.month_widget_event_title_2;
        int faceId = row == 1
            ? R.id.month_widget_event_face_1
            : R.id.month_widget_event_face_2;
        int barId = row == 1
            ? R.id.month_widget_event_bar_1
            : R.id.month_widget_event_bar_2;

        if (event == null) {
            if (row == 1) {
                views.setViewVisibility(containerId, View.VISIBLE);
                views.setTextViewText(timeId, "");
                views.setTextViewText(titleId, "Nada pendiente por aquí ♡");
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
        Intent intent = new Intent(context, AereaMonthWidget.class);
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
            widgetId + 10_000,
            launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_MUTABLE
        );
    }

    private static String capitalize(String value) {
        if (value == null || value.isEmpty()) return "";
        return value.substring(0, 1).toUpperCase(new Locale("es")) + value.substring(1);
    }
}
