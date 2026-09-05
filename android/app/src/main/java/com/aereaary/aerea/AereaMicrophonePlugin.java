package com.aereaary.aerea;

import android.Manifest;

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
    @PluginMethod
    public void status(PluginCall call) {
        JSObject result = new JSObject();
        result.put(
            "permission",
            getPermissionState("microphone") == PermissionState.GRANTED
                ? "granted"
                : "denied"
        );
        call.resolve(result);
    }

    @PluginMethod
    public void requestPermissions(PluginCall call) {
        if (getPermissionState("microphone") == PermissionState.GRANTED) {
            status(call);
            return;
        }
        requestPermissionForAlias("microphone", call, "permissionResult");
    }

    @com.getcapacitor.annotation.PermissionCallback
    private void permissionResult(PluginCall call) {
        status(call);
    }
}
