import { rename } from "node:fs/promises";

await rename("native-shell/native.html", "native-shell/index.html");
