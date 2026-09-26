import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.aereaary.aerea",
  appName: "aérea",
  webDir: "native-shell",
  android: {
    backgroundColor: "#f5f6f8",
  },
  plugins: {
    SystemBars: {
      style: "LIGHT",
      insetsHandling: "css",
    },
  },
};

export default config;
