package com.aereaary.aerea;

import android.Manifest;
import android.content.Intent;
import android.net.Uri;
import android.provider.Settings;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;

@CapacitorPlugin(
    name = "AereaMicrophone",
    permissions = {
        @Permission(alias = "microphone", strings = { Manifest.permission.RECORD_AUDIO })
    }
)
public class AereaMicrophonePlugin extends Plugin {
    private static final String MICROPHONE_ALIAS = "microphone";

    @PluginMethod
    public void status(PluginCall call) {
        JSObject result = new JSObject();
        result.put(
            "permission",
            getPermissionState(MICROPHONE_ALIAS) == PermissionState.GRANTED
                ? "granted"
                : "denied"
        );
        call.resolve(result);
    }

    @PluginMethod
    @Override
    public void requestPermissions(PluginCall call) {
        PermissionState state = getPermissionState(MICROPHONE_ALIAS);

        if (state == PermissionState.GRANTED) {
            status(call);
            return;
        }

        // PROMPT / PROMPT_WITH_RATIONALE can still produce Android's native dialog.
        // DENIED is Capacitor's persisted "denied permanently" state; asking again
        // returns immediately with no UI. In that case, open aérea's app settings
        // so Start recording always gives the user an actionable native screen.
        if (state == PermissionState.DENIED) {
            openAppPermissionSettings();
            status(call);
            return;
        }

        requestPermissionForAlias("microphone", call, "permissionResult");
    }

    @com.getcapacitor.annotation.PermissionCallback
    private void permissionResult(PluginCall call) {
        if (getPermissionState(MICROPHONE_ALIAS) == PermissionState.DENIED) {
            openAppPermissionSettings();
        }
        status(call);
    }

    private void openAppPermissionSettings() {
        if (getActivity() == null) return;

        Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
        intent.setData(Uri.parse("package:" + getContext().getPackageName()));
        getActivity().startActivity(intent);
    }
}
