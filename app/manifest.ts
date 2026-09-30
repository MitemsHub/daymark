import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Daymark: Date & Week Calculator + Co-op Reference",
    short_name: "Daymark",
    description:
      "Inclusive/exclusive day counts, a descending week countdown that matches the printed wall calendar, and private reference tables for investment series and member grades.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#f7f5f0",
    theme_color: "#f7f5f0",
    categories: ["productivity", "utilities", "finance"],
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
