import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const assets = JSON.parse(read("app/app-icon-assets.json"));
const manifest = read("android/app/src/main/AndroidManifest.xml");
const plugin = read("android/app/src/main/java/com/aereaary/aerea/AereaAppIconsPlugin.java");
const styles = read("android/app/src/main/res/values/styles.xml");

test("each supplied icon has a matching launcher alias, compat splash and embedded image", () => {
  assert.equal(assets.options.length, 9);
  assert.equal(new Set(assets.options.map((icon) => icon.id)).size, 9);
  for (const { id, image } of assets.options) {
    const png = Buffer.from(image, "base64");
    assert.equal(png.subarray(1, 4).toString(), "PNG");
    assert.equal(png.readUInt32BE(16), 384);
    assert.equal(png.readUInt32BE(20), 384);
    const alias = manifest.match(new RegExp(`<activity-alias android:name="\\.AppIcon_${id}"[\\s\\S]*?<\\/activity-alias>`))?.[0];
    assert.ok(alias, id);
    assert.match(alias, /android:enabled="false"/);
    assert.match(alias, /android:targetActivity="\.MainActivity"/);
    assert.ok(alias.includes(`@drawable/aerea_icon_${id}`));
    assert.ok(styles.includes(`name="AppTheme.Starting.${id}"`));
    assert.ok(plugin.includes(`"${id}"`));
  }
});

test("a clean install has exactly one launcher and keeps MainActivity, auth and widgets available", () => {
  const aliases = [...manifest.matchAll(/<activity-alias\b[\s\S]*?<\/activity-alias>/g)].map((match) => match[0]);
  assert.equal(aliases.length, 10);
  assert.equal(aliases.filter((alias) => alias.includes('android:enabled="true"')).length, 1);
  assert.ok(aliases.find((alias) => alias.includes('.AppIcon_original')).includes('@mipmap/ic_launcher'));
  const activity = manifest.match(/<activity\b[\s\S]*?<\/activity>/)?.[0];
  assert.doesNotMatch(activity, /category.LAUNCHER|android:enabled="false"/);
  assert.match(activity, /android:launchMode="singleTask"/);
  assert.match(activity, /android:scheme="aerea"/);
  assert.match(manifest, /AereaTodayWidget/);
  assert.match(manifest, /AereaMonthWidget/);
  const notifications = read("android/app/src/main/java/com/aereaary/aerea/AereaEventNotificationReceiver.java");
  assert.match(notifications, /new Intent\(context, MainActivity\.class\)/);
  assert.doesNotMatch(notifications, /getLaunchIntentForPackage/);
  assert.doesNotMatch(plugin, /MainActivity\.class|delete|clear\(|AereaStorage/);
});

test("Android 12 uses the launching alias icon on the requested charcoal splash", () => {
  const api31 = read("android/app/src/main/res/values-v31/styles.xml");
  assert.match(api31, /android:windowSplashScreenAnimatedIcon">@null/);
  assert.match(api31, /windowSplashScreenBackground">@color\/aerea_launch_background/);
  for (const variant of ["values", "values-night"]) {
    assert.match(read(`android/app/src/main/res/${variant}/colors.xml`), /aerea_launch_background">#171719/);
  }
});

test("icons use device component state, update atomically when available and enable the replacement first otherwise", () => {
  assert.match(plugin, /setComponentEnabledSettings\(changes\)/);
  assert.match(plugin, /VERSION_CODES.TIRAMISU/);
  assert.match(plugin, /DONT_KILL_APP/);
  assert.ok(plugin.indexOf('component(context, selected),') < plugin.indexOf('for (String id : IDS) if (!id.equals(selected))'));
  assert.match(plugin, /getComponentEnabledSetting/);
  assert.match(plugin, /Unknown app icon/);
  assert.match(plugin, /restore\(manager/);
  assert.doesNotMatch(plugin, /SharedPreferences|putState|localStorage|https:/);
});
