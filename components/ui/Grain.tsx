"use client";

import { useEnvironment } from "@/components/providers/Environment";

/**
 * Filmic grain across the dark zone only. Opacity is multiplied by
 * `--grain-opacity`, which the temperature scrub drives to 0 as the page
 * cools — so porcelain never inherits the texture (§14).
 */
export function Grain() {
  const { reduced } = useEnvironment();
  if (reduced) return null;
  return <div className="grain" aria-hidden="true" />;
}
