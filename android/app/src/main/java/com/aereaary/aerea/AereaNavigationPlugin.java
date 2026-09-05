package com.aereaary.aerea;

import android.widget.Toast;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "AereaNavigation")
public class AereaNavigationPlugin extends Plugin {
    // AEREA_RECOVERY_FIX_003: native Android/Samsung Toast, not a custom in-app card.
    @PluginMethod
    public void showExitHint(PluginCall call) {
        String message = call.getString("message", "Presiona Atrás otra vez para salir de aérea");
        getActivity().runOnUiThread(() ->
            Toast.makeText(getContext(), message, Toast.LENGTH_SHORT).show()
        );
        call.resolve();
    }

    @PluginMethod
    public void exitApp(PluginCall call) {
        call.resolve();
        getActivity().finish();
    }
}
