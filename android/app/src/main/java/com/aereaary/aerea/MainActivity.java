package com.aereaary.aerea;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private void captureAereaAuthIntent(Intent intent) {
        if (intent == null) return;

        Uri uri = intent.getData();
        if (uri == null) return;

        String scheme = uri.getScheme();
        String host = uri.getHost();
        String path = uri.getPath();

        if (
            "aerea".equalsIgnoreCase(scheme) &&
            "auth".equalsIgnoreCase(host) &&
            path != null &&
            path.startsWith("/callback")
        ) {
            AereaAuthPlugin.storePendingUrl(this, uri.toString());
        }
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        captureAereaAuthIntent(getIntent());
        super.onCreate(savedInstanceState);

        registerPlugin(AereaWidgetPlugin.class);
        registerPlugin(AereaStoragePlugin.class);
        registerPlugin(AereaAuthPlugin.class);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        captureAereaAuthIntent(intent);
    }
}
