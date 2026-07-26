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
