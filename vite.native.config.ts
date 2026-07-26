import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    outDir: "native-shell",
    emptyOutDir: true,
    rollupOptions: {
      input: { index: resolve(__dirname, "native.html") },
    },
  },
});
