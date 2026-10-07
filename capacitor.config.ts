import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.aereaary.aerea",
  appName: "aérea",
  webDir: "native-shell",
  android: {
    backgroundColor: "#171719",
  },
  plugins: {
    SystemBars: {
      style: "LIGHT",
      insetsHandling: "css",
    },
  },
};

export default config;
