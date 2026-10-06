package com.aereaary.aerea;

import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.Signature;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import androidx.activity.result.ActivityResult;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Arrays;
import java.util.HashSet;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;
import org.json.JSONArray;
import org.json.JSONObject;

@CapacitorPlugin(name = "AereaUpdates")
public class AereaUpdatesPlugin extends Plugin {
    private final ExecutorService worker = Executors.newSingleThreadExecutor();
    private final AtomicBoolean downloading = new AtomicBoolean(false);
    private final AtomicBoolean cancelled = new AtomicBoolean(false);
    private volatile HttpURLConnection activeDownload;
    private volatile JSONObject available;

    private File file(String name) { return new File(AereaUpdateCleanupReceiver.directory(getContext()), name); }

    private PackageInfo installed() throws Exception {
        return getContext().getPackageManager().getPackageInfo(getContext().getPackageName(), signatureFlags());
    }

    private int signatureFlags() {
        return Build.VERSION.SDK_INT >= 28 ? PackageManager.GET_SIGNING_CERTIFICATES : PackageManager.GET_SIGNATURES;
    }

    private long versionCode(PackageInfo info) {
        return Build.VERSION.SDK_INT >= 28 ? info.getLongVersionCode() : info.versionCode;
    }

    private Signature[] signatures(PackageInfo info) {
        return Build.VERSION.SDK_INT >= 28 && info.signingInfo != null
            ? info.signingInfo.getApkContentsSigners() : info.signatures;
    }

    private boolean validMetadata(JSONObject release) {
        return release != null && AereaUpdatePolicy.validAsset(release.optString("tag"),
            release.optString("url"), release.optString("digest"), release.optLong("size")) &&
            release.optLong("versionCode") == AereaUpdatePolicy.versionCode(release.optString("tag"));
    }

    private JSONObject ready() throws Exception {
        File apk = file("update.apk");
        File metadata = file("ready.json");
        if (!apk.isFile() || !metadata.isFile()) return null;
        try (InputStream input = new FileInputStream(metadata)) {
            JSONObject release = new JSONObject(readText(input, 8192));
            if (validMetadata(release) && apk.length() == release.getLong("size") &&
                release.getLong("versionCode") > versionCode(installed()) &&
                !AereaUpdatePolicy.expired(apk.lastModified(), System.currentTimeMillis())) return release;
        } catch (Exception ignored) { /* Partial/expired metadata is disposable. */ }
        AereaUpdateCleanupReceiver.clear(getContext());
        return null;
    }

    private void prune() throws Exception {
        if (downloading.get()) return;
        if (ready() == null) AereaUpdateCleanupReceiver.clear(getContext());
    }

    private JSObject status() throws Exception {
        PackageInfo current = installed();
        JSONObject cached = ready();
        JSONObject latest = available;
        if (latest == null && cached != null) latest = cached;
        JSObject result = new JSObject();
        result.put("installedVersion", current.versionName);
        result.put("installedCode", versionCode(current));
        result.put("available", latest == null ? JSONObject.NULL : new JSObject(latest.toString()));
        result.put("ready", cached != null && latest != null && cached.optLong("versionCode") == latest.optLong("versionCode"));
        return result;
    }

    @PluginMethod
    public void getStatus(PluginCall call) {
        worker.execute(() -> {
            try { prune(); call.resolve(status()); }
            catch (Exception error) { call.reject("Could not read the installed version.", error); }
        });
    }

    @PluginMethod
    public void check(PluginCall call) {
        worker.execute(() -> {
            try {
                prune();
                HttpURLConnection connection = (HttpURLConnection) new URL(AereaUpdatePolicy.RELEASES_URL).openConnection();
                connection.setConnectTimeout(10000);
                connection.setReadTimeout(15000);
                connection.setRequestProperty("Accept", "application/vnd.github+json");
                connection.setRequestProperty("User-Agent", "aerea-android-updater");
                String body;
                try {
                    if (connection.getResponseCode() != 200) throw new Exception("Release service unavailable");
                    try (InputStream input = connection.getInputStream()) { body = readText(input, 2 * 1024 * 1024); }
                } finally { connection.disconnect(); }
                JSONArray releases = new JSONArray(body);
                long highest = versionCode(installed());
                JSONObject latest = null;
                // Preview releases are intentional: /releases/latest excludes them.
                for (int i = 0; i < releases.length(); i++) {
                    JSONObject release = releases.getJSONObject(i);
                    String tag = release.optString("tag_name");
                    long code = AereaUpdatePolicy.versionCode(tag);
                    if (release.optBoolean("draft") || code <= highest) continue;
                    JSONArray assets = release.optJSONArray("assets");
                    if (assets == null) continue;
                    for (int j = 0; j < assets.length(); j++) {
                        JSONObject asset = assets.getJSONObject(j);
                        if (!"aerea.apk".equals(asset.optString("name")) || !"uploaded".equals(asset.optString("state"))) continue;
                        String url = asset.optString("browser_download_url");
                        String digest = asset.optString("digest");
                        long size = asset.optLong("size");
                        if (!AereaUpdatePolicy.validAsset(tag, url, digest, size)) continue;
                        latest = new JSONObject().put("tag", tag).put("version", tag.substring("aerea-v".length()))
                            .put("versionCode", code).put("url", url).put("digest", digest).put("size", size);
                        highest = code;
                    }
                }
                available = latest;
                call.resolve(status());
            } catch (Exception error) { call.reject("Could not check for updates. Try again when you are online.", error); }
        });
    }

    private static String readText(InputStream input, int limit) throws Exception {
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        byte[] buffer = new byte[8192];
        int count;
        while ((count = input.read(buffer)) != -1) {
            if (output.size() + count > limit) throw new Exception("Response too large");
            output.write(buffer, 0, count);
        }
        return output.toString(StandardCharsets.UTF_8.name());
    }

    private HttpURLConnection openDownload(String url) throws Exception {
        for (int redirects = 0; redirects < 6; redirects++) {
            if (!AereaUpdatePolicy.allowedDownloadUrl(url)) throw new Exception("Unexpected download source");
            HttpURLConnection connection = (HttpURLConnection) new URL(url).openConnection();
            activeDownload = connection;
            connection.setInstanceFollowRedirects(false);
            connection.setConnectTimeout(15000);
            connection.setReadTimeout(20000);
            connection.setRequestProperty("User-Agent", "aerea-android-updater");
            int code = connection.getResponseCode();
            if (code == 200) return connection;
            String location = connection.getHeaderField("Location");
            connection.disconnect();
            if (code < 300 || code > 399 || location == null) throw new Exception("Download unavailable");
            url = new URL(new URL(url), location).toString();
        }
        throw new Exception("Too many redirects");
    }

    @PluginMethod
    public void download(PluginCall call) {
        JSONObject release = available;
        if (!validMetadata(release)) { call.reject("Check for an update first."); return; }
        if (!downloading.compareAndSet(false, true)) { call.reject("An update is already downloading."); return; }
        cancelled.set(false);
        worker.execute(() -> {
            try {
                JSONObject cached = ready();
                if (cached == null || cached.optLong("versionCode") != release.optLong("versionCode")) {
                    AereaUpdateCleanupReceiver.clear(getContext());
                    File directory = AereaUpdateCleanupReceiver.directory(getContext());
                    if (!directory.mkdirs() && !directory.isDirectory()) throw new Exception("No download storage");
                    HttpURLConnection connection = openDownload(release.getString("url"));
                    long total = 0;
                    long lastProgress = 0;
                    try (InputStream input = connection.getInputStream(); FileOutputStream output = new FileOutputStream(file("update.part.apk"))) {
                        byte[] buffer = new byte[32768];
                        int count;
                        while ((count = input.read(buffer)) != -1) {
                            if (cancelled.get()) throw new Exception("Cancelled");
                            total += count;
                            if (total > release.getLong("size") || total > AereaUpdatePolicy.MAX_APK_BYTES) throw new Exception("Download too large");
                            output.write(buffer, 0, count);
                            long now = System.currentTimeMillis();
                            if (now - lastProgress > 200) {
                                JSObject progress = new JSObject();
                                progress.put("percent", (int) (100L * total / release.getLong("size")));
                                notifyListeners("downloadProgress", progress);
                                lastProgress = now;
                            }
                        }
                    } finally { connection.disconnect(); activeDownload = null; }
                    if (cancelled.get() || total != release.getLong("size")) throw new Exception("Incomplete download");
                    notifyListeners("downloadProgress", new JSObject().put("percent", 100));
                    validateApk(file("update.part.apk"), release);
                    if (!file("update.part.apk").renameTo(file("update.apk"))) throw new Exception("Could not save update");
                    try (FileOutputStream output = new FileOutputStream(file("ready.json"))) {
                        output.write(release.toString().getBytes(StandardCharsets.UTF_8));
                    }
                }
                if (cancelled.get()) throw new Exception("Cancelled");
                call.resolve(status());
            } catch (Exception error) {
                AereaUpdateCleanupReceiver.clear(getContext());
                call.reject(cancelled.get() ? "Download cancelled." : "Could not download or verify the update. Please try again.",
                    cancelled.get() ? "CANCELLED" : "DOWNLOAD_FAILED", error);
            } finally {
                if (activeDownload != null) activeDownload.disconnect();
                activeDownload = null;
                downloading.set(false);
            }
        });
    }

    @PluginMethod
    public void cancelDownload(PluginCall call) {
        cancelled.set(true);
        HttpURLConnection connection = activeDownload;
        if (connection != null) connection.disconnect();
        call.resolve();
    }

    private void validateApk(File apk, JSONObject release) throws Exception {
        if (!validMetadata(release) || apk.length() != release.getLong("size")) throw new Exception("Invalid APK size");
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        try (InputStream input = new FileInputStream(apk)) {
            byte[] buffer = new byte[32768];
            int count;
            while ((count = input.read(buffer)) != -1) digest.update(buffer, 0, count);
        }
        StringBuilder hash = new StringBuilder();
        for (byte value : digest.digest()) hash.append(String.format(java.util.Locale.ROOT, "%02x", value & 0xff));
        if (!("sha256:" + hash).equalsIgnoreCase(release.getString("digest"))) throw new Exception("Checksum mismatch");
        PackageManager manager = getContext().getPackageManager();
        PackageInfo candidate = manager.getPackageArchiveInfo(apk.getAbsolutePath(), signatureFlags());
        PackageInfo current = installed();
        if (candidate == null || !current.packageName.equals(candidate.packageName) ||
            versionCode(candidate) != release.getLong("versionCode") || versionCode(candidate) <= versionCode(current))
            throw new Exception("Incorrect package or version");
        Signature[] before = signatures(current);
        Signature[] after = signatures(candidate);
        if (before == null || after == null || before.length == 0 ||
            !new HashSet<>(Arrays.asList(before)).equals(new HashSet<>(Arrays.asList(after)))) throw new Exception("Signing key mismatch");
    }

    @PluginMethod
    public void install(PluginCall call) {
        // Installation and its permission are requested only after a user tap.
        if (Build.VERSION.SDK_INT >= 26 && !getContext().getPackageManager().canRequestPackageInstalls()) {
            try {
                Intent intent = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                    Uri.parse("package:" + getContext().getPackageName()));
                startActivityForResult(call, intent, "installPermissionResult");
            } catch (Exception error) { call.reject("Allow updates from aérea in Android settings, then try again.", error); }
            return;
        }
        openInstaller(call);
    }

    @ActivityCallback
    private void installPermissionResult(PluginCall call, ActivityResult result) {
        if (call == null) return;
        if (Build.VERSION.SDK_INT >= 26 && !getContext().getPackageManager().canRequestPackageInstalls()) {
            call.reject("Allow updates from aérea to install this version.");
            return;
        }
        openInstaller(call);
    }

    private void openInstaller(PluginCall call) {
        worker.execute(() -> {
            try {
                JSONObject release = ready();
                if (release == null) throw new Exception("Update expired");
                validateApk(file("update.apk"), release);
                Uri uri = FileProvider.getUriForFile(getContext(), getContext().getPackageName() + ".fileprovider", file("update.apk"));
                Intent intent = new Intent(Intent.ACTION_VIEW).setDataAndType(uri, "application/vnd.android.package-archive")
                    .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                getActivity().runOnUiThread(() -> {
                    try { getActivity().startActivity(intent); call.resolve(); }
                    catch (Exception error) { call.reject("Could not open the Android installer.", error); }
                });
            } catch (Exception error) {
                AereaUpdateCleanupReceiver.clear(getContext());
                call.reject("The update is no longer ready. Download it again.", error);
            }
        });
    }

    @Override
    protected void handleOnDestroy() {
        cancelled.set(true);
        if (activeDownload != null) activeDownload.disconnect();
        worker.shutdown();
        super.handleOnDestroy();
    }
}
