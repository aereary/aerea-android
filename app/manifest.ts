import type { MetadataRoute } from "next";
import { APP_APPEARANCE, APP_IDENTITY } from "./config/app-config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: APP_IDENTITY.manifestName,
    short_name: APP_IDENTITY.name,
    description: APP_IDENTITY.manifestDescription,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: APP_APPEARANCE.manifestBackgroundColor,
    theme_color: APP_APPEARANCE.browserThemeColor,
    orientation: "any",
    categories: ["productivity", "lifestyle", "education"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
