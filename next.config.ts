import type { NextConfig } from "next";

/**
 * Turbopack's on-disk cache does not survive on exFAT.
 *
 * This project lives on an external SSD. Turbopack writes a database under
 * `<distDir>/cache/turbopack` and, on the next start, fails to reopen it:
 *
 *   Failed to open database
 *     0: Loading persistence directory failed
 *     1: invalid digit found in string
 *
 * The first run always works and every run after it dies, so the cache is
 * turned off here. The cost is a cold compile on each start — a few hundred
 * milliseconds for a project this size — in exchange for `npm run dev` simply
 * working every time.
 *
 * Move the repo to an APFS volume and you can have the cache back: set
 * `BATON_FS_CACHE=1` in the environment.
 */
const fileSystemCache = process.env.BATON_FS_CACHE === "1";

const nextConfig: NextConfig = {
  experimental: {
    turbopackFileSystemCacheForDev: fileSystemCache,
    turbopackFileSystemCacheForBuild: fileSystemCache,
  },

  /**
   * Dev and production output are kept apart as well, so a `next build` and a
   * running `next dev` never contend for the same directory.
   */
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",

  devIndicators: false,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  // WebLLM ships its own worker + wasm; keeping it out of the server bundle
  // avoids Node resolving browser-only entrypoints during prerender.
  serverExternalPackages: ["@mlc-ai/web-llm"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default nextConfig;
