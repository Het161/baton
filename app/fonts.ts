import localFont from "next/font/local";
import { JetBrains_Mono } from "next/font/google";

/**
 * Display — Technor (Fontshare), shipped as a single variable file (200–900).
 * Used at 600/800 in the type scale; the variable axis keeps the payload at one request.
 */
export const technor = localFont({
  src: [{ path: "../fonts/Technor-Variable.woff2", weight: "200 900", style: "normal" }],
  variable: "--font-technor",
  display: "swap",
  preload: true,
  fallback: ["Clash Display", "ui-sans-serif", "system-ui", "sans-serif"],
});

/** Body — Satoshi (Fontshare), 400/500/700. Preloaded: it sets nearly every
 *  block of copy on the page, and letting it swap late costs layout shift. */
export const satoshi = localFont({
  src: [
    { path: "../fonts/Satoshi-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/Satoshi-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/Satoshi-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-satoshi",
  display: "swap",
  preload: true,
  fallback: ["ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
});

/** Utility/mono — labels, metrics, the zero-bytes counter. 400 and 500 only:
 *  nothing in the design sets mono at bold. */
export const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const fontClassNames = [technor.variable, satoshi.variable, jetbrains.variable].join(" ");
