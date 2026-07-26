import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "aérea — gentle calendar & notes",
    short_name: "aérea",
    description:
      "A cozy personal calendar, notes, habits, focus timer, recordings, moods, and sketchbook.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#fffdf9",
    theme_color: "#bfe7f7",
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
