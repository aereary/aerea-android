package com.aereaary.aerea;

import android.content.Intent;
import android.content.res.Configuration;
import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.View;

import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import androidx.core.splashscreen.SplashScreen;

import com.getcapacitor.JSObject;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private boolean launchReady = false;
    private final Handler launchHandler = new Handler(Looper.getMainLooper());
    private final Runnable launchSafetyTimeout = () -> launchReady = true;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        SplashScreen splashScreen = SplashScreen.installSplashScreen(this);
        int launchThemeColor = AereaStoragePlugin.launchThemeColor(this);
        getWindow().setBackgroundDrawable(new ColorDrawable(launchThemeColor));
        Intent initialIntent = getIntent();
        if (initialIntent != null && initialIntent.getDataString() != null) {
            AereaAuthPlugin.storePendingLink(this, initialIntent.getDataString());
        }
        // Capacitor collects custom plugins while BridgeActivity is being built,
        // so registration must happen before super.onCreate().
        registerPlugin(AereaWidgetPlugin.class);
        registerPlugin(AereaStoragePlugin.class);
        registerPlugin(AereaAuthPlugin.class);
        registerPlugin(AereaSportsNotificationsPlugin.class);
        registerPlugin(AereaEventNotificationsPlugin.class);
        registerPlugin(AereaNavigationPlugin.class);
        registerPlugin(AereaMicrophonePlugin.class);
        configureEdgeToEdge();
        super.onCreate(savedInstanceState);
        splashScreen.setKeepOnScreenCondition(() -> !launchReady);
        // Never strand the user on the native launch screen if WebView startup
        // fails before React can report its first complete frame.
        launchHandler.postDelayed(launchSafetyTimeout, 4_000L);
        getOnBackPressedDispatcher().addCallback(this, new androidx.activity.OnBackPressedCallback(true) {
            @Override public void handleOnBackPressed() {
                if (getBridge() != null) {
                    getBridge().triggerWindowJSEvent("aereaAndroidBack", "{}");
                }
            }
        });
        configureEdgeToEdge();

        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().setBackgroundColor(launchThemeColor);
            getBridge().getWebView().setOverScrollMode(View.OVER_SCROLL_NEVER);
        }
    }

    public void completeLaunch() {
        launchHandler.removeCallbacks(launchSafetyTimeout);
        launchReady = true;
    }

    @Override
    protected void onDestroy() {
        launchHandler.removeCallbacks(launchSafetyTimeout);
        super.onDestroy();
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);

        String url = intent == null ? null : intent.getDataString();
        if (url == null || url.isBlank()) return;

        AereaAuthPlugin.storePendingLink(this, url);
        if (getBridge() != null) {
            JSObject detail = new JSObject();
            detail.put("url", url);
            getBridge().triggerWindowJSEvent(
                AereaAuthPlugin.EVENT_NAME,
                detail.toString()
            );
        }
    }

    private void configureEdgeToEdge() {
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        getWindow().setStatusBarColor(Color.TRANSPARENT);
        getWindow().setNavigationBarColor(Color.TRANSPARENT);
        boolean isNightMode = (
                getResources().getConfiguration().uiMode &
                Configuration.UI_MODE_NIGHT_MASK
        ) == Configuration.UI_MODE_NIGHT_YES;
        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(
                getWindow(),
                getWindow().getDecorView()
        );
        controller.setAppearanceLightStatusBars(!isNightMode);
        controller.setAppearanceLightNavigationBars(!isNightMode);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            getWindow().setStatusBarContrastEnforced(false);
            getWindow().setNavigationBarContrastEnforced(false);
            getWindow().setNavigationBarDividerColor(Color.TRANSPARENT);
        }
    }
}
