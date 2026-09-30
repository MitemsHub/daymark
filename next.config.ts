import type { NextConfig } from "next";

// GitHub Pages serves project sites from a subpath, so every internal URL
// needs the /daymark prefix. The Pages build sets PAGES_BASE_PATH; local
// dev, `npm run build` and Vercel stay unprefixed.
const basePath = process.env.PAGES_BASE_PATH || "";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Static export is only wanted for the Pages pipeline. Setting it from an
  // env flag keeps `npm run build` a normal build.
  ...(process.env.STATIC_EXPORT === "1" ? { output: "export" as const, basePath, trailingSlash: true } : {}),
};

export default nextConfig;
