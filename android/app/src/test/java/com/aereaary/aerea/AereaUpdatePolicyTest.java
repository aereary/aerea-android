package com.aereaary.aerea;

import org.junit.Test;
import static org.junit.Assert.*;

public class AereaUpdatePolicyTest {
    private final String hash = "sha256:" + new String(new char[64]).replace('\0', 'a');

    @Test public void previewTagsUseTheInstalledAndroidVersionCode() {
        assertEquals(260827112L, AereaUpdatePolicy.versionCode("aerea-v0.112"));
        assertTrue(AereaUpdatePolicy.versionCode("aerea-v0.113") > AereaUpdatePolicy.versionCode("aerea-v0.112"));
        assertTrue(AereaUpdatePolicy.versionCode("aerea-v0.112") > AereaUpdatePolicy.versionCode("aerea-v0.9"));
        for (String tag : new String[]{"v0.113", "aerea-v0.0", "aerea-v0.113-beta", "aerea-v1.113", "aerea-v0.-1", "aerea-v0.9999999999999"})
            assertEquals(-1L, AereaUpdatePolicy.versionCode(tag));
    }

    @Test public void acceptsOnlyTheExactRepositoryApkWithAnIntegrityDigest() {
        String tag = "aerea-v0.113";
        String url = AereaUpdatePolicy.DOWNLOAD_PREFIX + tag + "/aerea.apk";
        assertTrue(AereaUpdatePolicy.validAsset(tag, url, hash, 10443470));
        assertFalse(AereaUpdatePolicy.validAsset(tag, url, "", 10443470));
        assertFalse(AereaUpdatePolicy.validAsset(tag, url, hash, 0));
        assertFalse(AereaUpdatePolicy.validAsset(tag, url, hash, AereaUpdatePolicy.MAX_APK_BYTES + 1));
        assertFalse(AereaUpdatePolicy.validAsset(tag, url + "?other=true", hash, 10443470));
        assertFalse(AereaUpdatePolicy.validAsset(tag, url.replace("aereary", "other"), hash, 10443470));
        assertFalse(AereaUpdatePolicy.validAsset(tag, url.replace("0.113", "0.112"), hash, 10443470));
    }

    @Test public void redirectsStayOnHttpsGitHubAssetHosts() {
        assertTrue(AereaUpdatePolicy.allowedDownloadUrl("https://release-assets.githubusercontent.com/path?token=x"));
        assertTrue(AereaUpdatePolicy.allowedDownloadUrl("https://objects.githubusercontent.com/path"));
        assertTrue(AereaUpdatePolicy.allowedDownloadUrl("https://github.com/aereary/aerea-android/releases/download/aerea-v0.113/aerea.apk"));
        for (String url : new String[]{"http://github.com/path", "https://github.com.evil.test/path", "https://github.com@evil.test/path",
            "https://evil.test@github.com/path", "https://github.com:8443/path", "file:///tmp/aerea.apk", "invalid"})
            assertFalse(url, AereaUpdatePolicy.allowedDownloadUrl(url));
    }

    @Test public void obsoleteTemporaryApksExpireAfterOneDay() {
        long now = 200000000L;
        assertFalse(AereaUpdatePolicy.expired(now - 1000, now));
        assertTrue(AereaUpdatePolicy.expired(now - AereaUpdatePolicy.CACHE_MAX_AGE_MS, now));
        assertTrue(AereaUpdatePolicy.expired(now + 1, now));
        assertTrue(AereaUpdatePolicy.expired(0, now));
    }
}
