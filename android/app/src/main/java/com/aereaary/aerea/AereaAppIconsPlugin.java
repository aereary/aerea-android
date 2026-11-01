package com.aereaary.aerea;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ShortcutInfo;
import android.content.pm.ShortcutManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.ImageDecoder;
import android.graphics.drawable.Icon;
import android.util.Base64;
import com.getcapacitor.annotation.ActivityCallback;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.Collections;
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

    @PluginMethod
    public void pickCustomImage(PluginCall call) {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("image/*");
        startActivityForResult(call, intent, "customImagePicked");
    }

    @ActivityCallback
    private void customImagePicked(PluginCall call, androidx.activity.result.ActivityResult result) {
        if (call == null) return;
        if (result.getResultCode() != android.app.Activity.RESULT_OK || result.getData() == null || result.getData().getData() == null) {
            call.resolve(new JSObject().put("cancelled", true));
            return;
        }
        android.net.Uri uri = result.getData().getData();
        // Decoding is off the UI thread and bounded before allocating the image.
        getBridge().execute(() -> {
            try {
                Bitmap bitmap;
                if (Build.VERSION.SDK_INT >= 28) {
                    bitmap = ImageDecoder.decodeBitmap(ImageDecoder.createSource(getContext().getContentResolver(), uri), (decoder, info, source) -> {
                        int width = info.getSize().getWidth(), height = info.getSize().getHeight();
                        float scale = Math.min(1f, 1024f / Math.max(width, height));
                        decoder.setTargetSize(Math.max(1, Math.round(width * scale)), Math.max(1, Math.round(height * scale)));
                        decoder.setAllocator(ImageDecoder.ALLOCATOR_SOFTWARE);
                    });
                } else {
                    BitmapFactory.Options options = new BitmapFactory.Options();
                    options.inJustDecodeBounds = true;
                    try (InputStream stream = getContext().getContentResolver().openInputStream(uri)) { BitmapFactory.decodeStream(stream, null, options); }
                    options.inJustDecodeBounds = false;
                    options.inSampleSize = 1;
                    while (Math.max(options.outWidth, options.outHeight) / options.inSampleSize > 1024) options.inSampleSize *= 2;
                    try (InputStream stream = getContext().getContentResolver().openInputStream(uri)) { bitmap = BitmapFactory.decodeStream(stream, null, options); }
                }
                if (bitmap == null) throw new IllegalArgumentException("Unsupported image");
                ByteArrayOutputStream bytes = new ByteArrayOutputStream();
                bitmap.compress(Bitmap.CompressFormat.PNG, 100, bytes);
                bitmap.recycle();
                call.resolve(new JSObject().put("image", "data:image/png;base64," + Base64.encodeToString(bytes.toByteArray(), Base64.NO_WRAP)));
            } catch (Exception error) { call.reject("Couldn't open this image. Try a PNG or JPEG.", error); }
        });
    }

    @PluginMethod
    public void pinCustomIcon(PluginCall call) {
        if (Build.VERSION.SDK_INT < 26) { call.reject("Custom home-screen icons need Android 8 or later."); return; }
        String encoded = call.getString("image", "");
        if (encoded.length() > 3000000 || !encoded.startsWith("data:image/png;base64,")) { call.reject("Invalid icon image."); return; }
        try {
            byte[] bytes = Base64.decode(encoded.substring(encoded.indexOf(',') + 1), Base64.DEFAULT);
            BitmapFactory.Options bounds = new BitmapFactory.Options();
            bounds.inJustDecodeBounds = true;
            BitmapFactory.decodeByteArray(bytes, 0, bytes.length, bounds);
            if (bounds.outWidth != 512 || bounds.outHeight != 512) { call.reject("Icon must be 512 by 512 pixels."); return; }
            Bitmap bitmap = BitmapFactory.decodeByteArray(bytes, 0, bytes.length);
            ShortcutManager manager = getContext().getSystemService(ShortcutManager.class);
            if (manager == null || !manager.isRequestPinShortcutSupported()) { call.reject("This launcher doesn't support custom shortcuts."); return; }
            Intent launch = new Intent(getContext(), MainActivity.class).setAction(Intent.ACTION_VIEW);
            ShortcutInfo shortcut = new ShortcutInfo.Builder(getContext(), "aerea-custom-icon")
                    .setShortLabel("aérea").setLongLabel("aérea")
                    .setIcon(Icon.createWithAdaptiveBitmap(bitmap)).setIntent(launch).build();
            boolean pinned = false;
            for (ShortcutInfo item : manager.getPinnedShortcuts()) if (item.getId().equals(shortcut.getId())) pinned = true;
            if (pinned) {
                if (!manager.updateShortcuts(Collections.singletonList(shortcut))) { call.reject("Couldn't update your shortcut."); return; }
                call.resolve(new JSObject().put("status", "updated"));
            } else if (manager.requestPinShortcut(shortcut, null)) {
                call.resolve(new JSObject().put("status", "requested"));
            } else { call.reject("Couldn't request a home-screen shortcut."); }
        } catch (Exception error) { call.reject("Couldn't create your custom shortcut.", error); }
    }

    private static void restore(PackageManager manager, ComponentName component, int state) {
        try { manager.setComponentEnabledSetting(component, state, PackageManager.DONT_KILL_APP); }
        catch (RuntimeException ignored) { /* Keep the enabled replacement launchable. */ }
    }
}
