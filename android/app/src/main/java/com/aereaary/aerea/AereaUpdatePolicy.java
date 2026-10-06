package com.aereaary.aerea;

import java.net.URI;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Release numbering is shared with build-apk.yml and app/build.gradle. */
final class AereaUpdatePolicy {
    static final String RELEASES_URL = "https://api.github.com/repos/aereary/aerea-android/releases?per_page=30";
    static final String DOWNLOAD_PREFIX = "https://github.com/aereary/aerea-android/releases/download/";
    static final long VERSION_BASE = 260827000L;
    static final long MAX_APK_BYTES = 150L * 1024L * 1024L;
    static final long CACHE_MAX_AGE_MS = 24L * 60L * 60L * 1000L;
    private static final Pattern TAG = Pattern.compile("^aerea-v0\\.([1-9][0-9]{0,8})$");

    static long versionCode(String tag) {
        Matcher match = TAG.matcher(tag == null ? "" : tag);
        return match.matches() ? VERSION_BASE + Long.parseLong(match.group(1)) : -1L;
    }

    static boolean validAsset(String tag, String url, String digest, long size) {
        return versionCode(tag) > 0 &&
            (DOWNLOAD_PREFIX + tag + "/aerea.apk").equals(url) &&
            digest != null && digest.matches("sha256:[a-fA-F0-9]{64}") &&
            size > 0 && size <= MAX_APK_BYTES;
    }

    static boolean allowedDownloadUrl(String url) {
        try {
            URI uri = URI.create(url);
            String host = uri.getHost();
            return "https".equals(uri.getScheme()) && uri.getUserInfo() == null &&
                (uri.getPort() == -1 || uri.getPort() == 443) &&
                ("github.com".equals(host) || "release-assets.githubusercontent.com".equals(host) ||
                    "objects.githubusercontent.com".equals(host));
        } catch (IllegalArgumentException error) {
            return false;
        }
    }

    static boolean expired(long modified, long now) {
        return modified <= 0 || now < modified || now - modified >= CACHE_MAX_AGE_MS;
    }
}
