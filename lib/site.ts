/**
 * Canonical origin for metadata, Open Graph, robots and the sitemap.
 *
 * Set `NEXT_PUBLIC_SITE_URL` to pin it; otherwise fall back to the production
 * domain, then to the current preview deployment, then to local.
 */
const host = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? (host ? `https://${host}` : "http://localhost:3000");
