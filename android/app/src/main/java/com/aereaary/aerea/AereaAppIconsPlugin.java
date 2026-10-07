package com.aereaary.aerea;

import android.content.ComponentName;
import android.content.Context;
import android.content.pm.PackageManager;
import android.os.Build;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@CapacitorPlugin(name = "AereaAppIcons")
public class AereaAppIconsPlugin extends Plugin {
    private static final String[] IDS = {
        "original", "pocket_heart", "bunny_cloud", "sunrise", "feather_orbit",
        "heart_planet", "little_pocket", "orbit_star", "moon_cloud", "orbital_a"
    };
    private static final int[] THEMES = {
        R.style.AppTheme_Starting, R.style.AppTheme_Starting_pocket_heart,
        R.style.AppTheme_Starting_bunny_cloud, R.style.AppTheme_Starting_sunrise,
        R.style.AppTheme_Starting_feather_orbit, R.style.AppTheme_Starting_heart_planet,
        R.style.AppTheme_Starting_little_pocket, R.style.AppTheme_Starting_orbit_star,
        R.style.AppTheme_Starting_moon_cloud, R.style.AppTheme_Starting_orbital_a
    };

    private static ComponentName component(Context context, String id) {
        return new ComponentName(context.getPackageName(),
                context.getPackageName() + ".AppIcon_" + id);
    }

    private static boolean enabled(PackageManager manager, ComponentName name, String id) {
        int state = manager.getComponentEnabledSetting(name);
        return state == PackageManager.COMPONENT_ENABLED_STATE_ENABLED ||
                (state == PackageManager.COMPONENT_ENABLED_STATE_DEFAULT && id.equals("original"));
    }

    // Android persists component overrides across app/process/APK updates.
    // Read the system's state rather than syncing a device icon with user data.
    static String currentIcon(Context context) {
        PackageManager manager = context.getPackageManager();
        for (String id : IDS) {
            if (enabled(manager, component(context, id), id)) return id;
        }
        return "original";
    }

    static int startingTheme(Context context) {
        String selected = currentIcon(context);
        for (int i = 0; i < IDS.length; i++) if (IDS[i].equals(selected)) return THEMES[i];
        return R.style.AppTheme_Starting;
    }

    @PluginMethod
    public void getCurrent(PluginCall call) {
        JSObject result = new JSObject();
        result.put("id", currentIcon(getContext()));
        call.resolve(result);
    }

    @PluginMethod
    public void setIcon(PluginCall call) {
        String selected = call.getString("id", "");
        if (!Arrays.asList(IDS).contains(selected)) {
            call.reject("Unknown app icon.");
            return;
        }
        getActivity().runOnUiThread(() -> {
            Context context = getContext();
            PackageManager manager = context.getPackageManager();
            int[] previous = new int[IDS.length];
            for (int i = 0; i < IDS.length; i++) {
                previous[i] = manager.getComponentEnabledSetting(component(context, IDS[i]));
            }
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    List<PackageManager.ComponentEnabledSetting> changes = new ArrayList<>();
                    for (String id : IDS) {
                        changes.add(new PackageManager.ComponentEnabledSetting(component(context, id),
                                id.equals(selected) ? PackageManager.COMPONENT_ENABLED_STATE_ENABLED :
                                        PackageManager.COMPONENT_ENABLED_STATE_DISABLED,
                                PackageManager.DONT_KILL_APP));
                    }
                    manager.setComponentEnabledSettings(changes);
                } else {
                    // Enable the replacement first: the app always stays launchable.
                    manager.setComponentEnabledSetting(component(context, selected),
                            PackageManager.COMPONENT_ENABLED_STATE_ENABLED, PackageManager.DONT_KILL_APP);
                    for (String id : IDS) if (!id.equals(selected)) {
                        manager.setComponentEnabledSetting(component(context, id),
                                PackageManager.COMPONENT_ENABLED_STATE_DISABLED, PackageManager.DONT_KILL_APP);
                    }
                }
                JSObject result = new JSObject();
                result.put("id", currentIcon(context));
                call.resolve(result);
            } catch (RuntimeException error) {
                // Restore enabled entries first if an older launcher update failed.
                for (int i = 0; i < IDS.length; i++) if (previous[i] != PackageManager.COMPONENT_ENABLED_STATE_DISABLED) {
                    restore(manager, component(context, IDS[i]), previous[i]);
                }
                for (int i = 0; i < IDS.length; i++) if (previous[i] == PackageManager.COMPONENT_ENABLED_STATE_DISABLED) {
                    restore(manager, component(context, IDS[i]), previous[i]);
                }
                call.reject("Couldn't change the app icon. Please try again.", error);
            }
        });
    }

    private static void restore(PackageManager manager, ComponentName component, int state) {
        try { manager.setComponentEnabledSetting(component, state, PackageManager.DONT_KILL_APP); }
        catch (RuntimeException ignored) { /* Keep the enabled replacement launchable. */ }
    }
}
