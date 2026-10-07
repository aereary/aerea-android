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

// One source for the Settings previews and Android launcher resources.
const { options: icons } = JSON.parse(await readFile(new URL("../app/app-icon-assets.json", import.meta.url), "utf8"));
const iconDir = "android/app/src/main/res/drawable-nodpi";
await mkdir(iconDir, { recursive: true });
for (const icon of icons) {
  if (!/^[a-z_]+$/.test(icon.id)) throw new Error("Invalid app icon resource name");
  await writeFile(`${iconDir}/aerea_icon_${icon.id}.png`, Buffer.from(icon.image, "base64"));
}
console.log(`Restored ${icons.length} optional app icons.`);
