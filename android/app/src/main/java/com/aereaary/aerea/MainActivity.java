package com.aereaary.aerea;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        registerPlugin(AereaWidgetPlugin.class);
        registerPlugin(AereaStoragePlugin.class);
    }
}
