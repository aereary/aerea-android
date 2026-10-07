import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const manifest = JSON.parse(
  await readFile(new URL("./android-binaries.json", import.meta.url), "utf8"),
);

for (const [path, encoded] of Object.entries(manifest)) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, Buffer.from(encoded, "base64"));
}

console.log(`Restored ${Object.keys(manifest).length} Android binary files.`);

// Legacy launchers and Settings use the same cropped, rounded tile.
const { options: icons } = JSON.parse(await readFile(new URL("../app/app-icon-assets.json", import.meta.url), "utf8"));
const native = JSON.parse(await readFile(new URL("./app-icon-native-assets.json", import.meta.url), "utf8"));
const iconDir = "android/app/src/main/res/drawable-nodpi";
const adaptiveDir = "android/app/src/main/res/drawable-anydpi-v26";
const drawableDir = "android/app/src/main/res/drawable";
await mkdir(iconDir, { recursive: true });
await mkdir(adaptiveDir, { recursive: true });
await mkdir(drawableDir, { recursive: true });
if (native.options.length !== icons.length) throw new Error("Incomplete adaptive icon catalog");
for (const icon of icons) {
  if (!/^[a-z_]+$/.test(icon.id)) throw new Error("Invalid app icon resource name");
  const layer = native.options.find((item) => item.id === icon.id);
  if (!layer) throw new Error(`Missing adaptive icon: ${icon.id}`);
  await writeFile(`${iconDir}/aerea_icon_${icon.id}.png`, Buffer.from(icon.image, "base64"));
  // Separate resource name: a <bitmap> cannot load the API 26 adaptive XML.
  await writeFile(`${iconDir}/aerea_icon_tile_${icon.id}.png`, Buffer.from(icon.image, "base64"));
  await writeFile(`${iconDir}/aerea_icon_bg_${icon.id}.png`, Buffer.from(layer.background, "base64"));
  // The artwork is in the opaque background layer. Its multicolor bitmap keeps
  // Android's splash from discarding the tile as a plain-color icon background.
  // Central 72/108 framing avoids both legacy white wrapping and double padding.
  await writeFile(`${adaptiveDir}/aerea_icon_${icon.id}.xml`, `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/aerea_icon_bg_${icon.id}" />
    <foreground android:drawable="@android:color/transparent" />
</adaptive-icon>
`);
  // Below Android 12, the compat splash clips to a 2/3 circle. A 5/9 tile
  // preserves its rounded corners inside that circle without an added frame.
  // Its 288dp canvas needs 64dp insets; dimensions also work on API 24/25,
  // which cannot inflate the fraction-valued insets added in API 26.
  await writeFile(`${drawableDir}/aerea_splash_${icon.id}.xml`, `<?xml version="1.0" encoding="utf-8"?>
<inset xmlns:android="http://schemas.android.com/apk/res/android" android:inset="64dp">
    <bitmap android:src="@drawable/aerea_icon_tile_${icon.id}" android:gravity="fill" android:filter="true" />
</inset>
`);
}
console.log(`Restored ${icons.length} optional app icons.`);
