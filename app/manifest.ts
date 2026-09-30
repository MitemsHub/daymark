import type { MetadataRoute } from "next";

export const dynamic = "force-static";

// GitHub Pages hosts the app under /daymark, so the manifest paths must
// carry that prefix when the Pages build runs. PAGES_BASE_PATH is empty
// everywhere else (dev, Vercel, npm run build).
const base = process.env.PAGES_BASE_PATH || "";
const root = base ? `${base}/` : "/";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Daymark: Date & Week Calculator + Co-op Reference",
    short_name: "Daymark",
    description:
      "Inclusive/exclusive day counts, a descending week countdown that matches the printed wall calendar, and private reference tables for investment series and member grades.",
    id: root,
    start_url: root,
    scope: root,
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#f7f5f0",
    theme_color: "#f7f5f0",
    categories: ["productivity", "utilities", "finance"],
    icons: [
      {
        src: `${root}icon-192.png`,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: `${root}icon-512.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: `${root}icon-maskable-512.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
