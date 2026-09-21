import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.aereaary.aerea",
  appName: "aérea",
  webDir: "native-shell",
  android: {
    backgroundColor: "#fff9ed",
  },
  plugins: {
    SystemBars: {
      style: "LIGHT",
      insetsHandling: "css",
    },
  },
};

export default config;
