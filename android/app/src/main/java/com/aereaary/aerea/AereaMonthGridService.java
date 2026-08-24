package com.aereaary.aerea;

import android.appwidget.AppWidgetManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.view.View;
import android.widget.RemoteViews;
import android.widget.RemoteViewsService;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.Calendar;

public class AereaMonthGridService extends RemoteViewsService {
    @Override
    public RemoteViewsFactory onGetViewFactory(Intent intent) {
        return new MonthFactory(getApplicationContext(), intent);
    }

    private static class MonthFactory implements RemoteViewsFactory {
        private final Context context;
        private final int year;
        private final int month;
        private SharedPreferences preferences;

        MonthFactory(Context context, Intent intent) {
            this.context = context;
            this.year = intent.getIntExtra(
                AereaMonthWidget.EXTRA_YEAR,
                Calendar.getInstance().get(Calendar.YEAR)
            );
            this.month = intent.getIntExtra(
                AereaMonthWidget.EXTRA_MONTH,
                Calendar.getInstance().get(Calendar.MONTH)
            );
        }

        @Override
        public void onCreate() {
            preferences = context.getSharedPreferences(
                AereaWidgetPlugin.PREFERENCES,
                Context.MODE_PRIVATE
            );
        }

        @Override
        public void onDataSetChanged() {
            preferences = context.getSharedPreferences(
                AereaWidgetPlugin.PREFERENCES,
                Context.MODE_PRIVATE
            );
        }

        @Override
        public void onDestroy() {}

        @Override
        public int getCount() {
            return 42;
        }

        @Override
        public RemoteViews getViewAt(int position) {
            if (preferences == null) {
                preferences = context.getSharedPreferences(
                    AereaWidgetPlugin.PREFERENCES,
                    Context.MODE_PRIVATE
                );
            }
            Calendar first = Calendar.getInstance();
            first.clear();
            first.set(year, month, 1);
            int leadingDays = first.get(Calendar.DAY_OF_WEEK) - Calendar.SUNDAY;
            Calendar cellDate = (Calendar) first.clone();
            cellDate.add(Calendar.DAY_OF_MONTH, position - leadingDays);
            boolean inMonth = cellDate.get(Calendar.MONTH) == month;
            boolean isToday = sameDay(cellDate, Calendar.getInstance());

            JSONObject day = AereaWidgetData.day(preferences, cellDate);
            JSONArray events = AereaWidgetData.events(day);
            String mood = day.optString("mood");
            String marker;
            if (!mood.isEmpty()) {
                marker = mood;
            } else if (day.optBoolean("complete", false)) {
                marker = "✓";
            } else {
                marker = eventDots(events.length());
            }

            RemoteViews views = new RemoteViews(
                context.getPackageName(),
                R.layout.aerea_month_day_cell
            );
            views.setTextViewText(
                R.id.month_day_number,
                String.valueOf(cellDate.get(Calendar.DAY_OF_MONTH))
            );
            views.setTextViewText(R.id.month_day_marker, marker);
            views.setTextColor(
                R.id.month_day_number,
                inMonth ? 0xFF34495E : 0x66718596
            );
            views.setTextColor(
                R.id.month_day_marker,
                day.optBoolean("complete", false) ? 0xFF5D9B70 : 0xFF8F75B8
            );
            views.setInt(
                R.id.month_day_root,
                "setBackgroundResource",
                isToday ? R.drawable.widget_day_today : R.drawable.widget_day_plain
            );
            views.setViewVisibility(
                R.id.month_day_marker,
                marker.isEmpty() ? View.INVISIBLE : View.VISIBLE
            );

            Intent fillInIntent = new Intent();
            fillInIntent.putExtra("aereaDate", AereaWidgetData.dateKey(cellDate));
            views.setOnClickFillInIntent(R.id.month_day_root, fillInIntent);
            return views;
        }

        @Override
        public RemoteViews getLoadingView() {
            RemoteViews loading = new RemoteViews(
                context.getPackageName(),
                R.layout.aerea_month_day_cell
            );
            loading.setTextViewText(R.id.month_day_number, "");
            loading.setTextViewText(R.id.month_day_marker, "");
            return loading;
        }

        @Override
        public int getViewTypeCount() {
            return 1;
        }

        @Override
        public long getItemId(int position) {
            Calendar first = Calendar.getInstance();
            first.clear();
            first.set(year, month, 1);
            first.add(
                Calendar.DAY_OF_MONTH,
                position - (first.get(Calendar.DAY_OF_WEEK) - Calendar.SUNDAY)
            );
            return first.getTimeInMillis();
        }

        @Override
        public boolean hasStableIds() {
            return true;
        }

        private static boolean sameDay(Calendar left, Calendar right) {
            return left.get(Calendar.YEAR) == right.get(Calendar.YEAR)
                && left.get(Calendar.DAY_OF_YEAR) == right.get(Calendar.DAY_OF_YEAR);
        }

        private static String eventDots(int count) {
            if (count <= 0) return "";
            if (count == 1) return "•";
            if (count == 2) return "••";
            return "•••";
        }
    }
}
