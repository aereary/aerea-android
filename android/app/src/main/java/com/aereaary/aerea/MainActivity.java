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
import android.webkit.WebView;

import androidx.core.splashscreen.SplashScreen;
import androidx.core.content.ContextCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final long MAX_SPLASH_HOLD_MS = 5000L;
    private volatile boolean launchReady = false;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        SplashScreen splashScreen = SplashScreen.installSplashScreen(this);
        splashScreen.setKeepOnScreenCondition(() -> !launchReady);
        new Handler(Looper.getMainLooper()).postDelayed(
                this::forceFinishLaunch,
                MAX_SPLASH_HOLD_MS
        );
        int launchThemeColor = ContextCompat.getColor(this, R.color.aerea_launch_background);
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

    public void finishLaunch() {
        if (launchReady) return;
        if (getBridge() == null || getBridge().getWebView() == null) {
            forceFinishLaunch();
            return;
        }

        WebView webView = getBridge().getWebView();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            webView.postVisualStateCallback(
                    System.nanoTime(),
                    requestId -> webView.postOnAnimation(this::forceFinishLaunch)
            );
            return;
        }
        webView.postDelayed(this::forceFinishLaunch, 32L);
    }

    private void forceFinishLaunch() {
        launchReady = true;
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
