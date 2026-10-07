import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { inflateSync } from "node:zlib";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const assets = JSON.parse(read("app/app-icon-assets.json"));
const manifest = read("android/app/src/main/AndroidManifest.xml");
const plugin = read("android/app/src/main/java/com/aereaary/aerea/AereaAppIconsPlugin.java");
const styles = read("android/app/src/main/res/values/styles.xml");

// Decode actual pixels, rather than trusting image dimensions or asset metadata.
function decodePng(png) {
  const width = png.readUInt32BE(16), height = png.readUInt32BE(20);
  assert.equal(png[24], 8);
  assert.equal(png[28], 0);
  const channels = png[25] === 6 ? 4 : 3;
  assert.ok([2, 6].includes(png[25]));
  const chunks = [];
  for (let p = 8; p < png.length;) {
    const length = png.readUInt32BE(p);
    if (png.toString("ascii", p + 4, p + 8) === "IDAT") chunks.push(png.subarray(p + 8, p + 8 + length));
    p += length + 12;
  }
  const raw = inflateSync(Buffer.concat(chunks)), stride = width * channels;
  const pixels = Buffer.alloc(height * stride);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    for (let x = 0; x < stride; x++) {
      const p = y * stride + x;
      const a = x >= channels ? pixels[p - channels] : 0;
      const b = y ? pixels[p - stride] : 0;
      const c = y && x >= channels ? pixels[p - stride - channels] : 0;
      const estimate = a + b - c;
      const distances = [Math.abs(estimate - a), Math.abs(estimate - b), Math.abs(estimate - c)];
      const paeth = distances[0] <= distances[1] && distances[0] <= distances[2] ? a : distances[1] <= distances[2] ? b : c;
      assert.ok(filter <= 4);
      pixels[p] = raw[y * (stride + 1) + x + 1] + [0, a, b, Math.floor((a + b) / 2), paeth][filter];
    }
  }
  return { width, height, channels, pixel: (x, y) => pixels.subarray((y * width + x) * channels, (y * width + x + 1) * channels) };
}

test("generated adaptive icons fill the launcher viewport and retain the complete tile on the splash", () => {
  const directory = mkdtempSync(join(tmpdir(), "aerea-icon-resources-"));
  try {
    execFileSync(process.execPath, [resolve("ci/restore-android-binaries.mjs")], { cwd: directory });
    for (const { id, image } of assets.options) {
      const resources = join(directory, "android/app/src/main/res");
      const adaptive = read(join(resources, `drawable-anydpi-v26/aerea_icon_${id}.xml`));
      assert.match(adaptive, /<adaptive-icon/);
      assert.ok(adaptive.includes(`background android:drawable="@drawable/aerea_icon_bg_${id}"`));
      assert.match(adaptive, /foreground android:drawable="@android:color\/transparent"/);
      const tile = decodePng(Buffer.from(image, "base64"));
      const background = decodePng(readFileSync(join(resources, `drawable-nodpi/aerea_icon_bg_${id}.png`)));
      assert.deepEqual([background.width, background.height, background.channels], [576, 576, 3]);
      assert.equal(tile.pixel(0, 0)[3], 0, `${id}: rounded transparent corners`);
      for (const [x, y] of [[192, 0], [0, 192], [383, 192], [192, 383]]) {
        assert.equal(tile.pixel(x, y)[3], 255, `${id}: tile reaches its canvas edges without a border`);
        const rgb = background.pixel(x + 96, y + 96);
        assert.ok(Math.max(...rgb) < 80, `${id}: no white frame`);
      }
      const colors = new Set();
      for (let y = 0; y < 384; y += 7) for (let x = 0; x < 384; x += 7) {
        const pixel = tile.pixel(x, y);
        if (pixel[3] === 255) assert.deepEqual(background.pixel(x + 96, y + 96), pixel.subarray(0, 3), `${id}: visible 72/108 area matches Settings, without additional scaling`);
        colors.add(background.pixel(x + 96, y + 96).toString("hex"));
      }
      assert.ok(colors.size > 100, `${id}: artwork stays in a multicolor background, so Android retains the entire tile`);
      const compat = read(join(resources, `drawable/aerea_splash_${id}.xml`));
      assert.ok(compat.includes(`@drawable/aerea_icon_tile_${id}`));
      assert.match(compat, /android:inset="64dp"/);
      assert.deepEqual(readFileSync(join(resources, `drawable-nodpi/aerea_icon_tile_${id}.png`)), Buffer.from(image, "base64"));
      assert.ok(styles.includes(`@drawable/aerea_splash_${id}`));
    }
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

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
  assert.match(api31, /android:windowSplashScreenIconBackgroundColor">@android:color\/transparent/);
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
