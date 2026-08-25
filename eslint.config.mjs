import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // dev-mode build output — see distDir in next.config.ts
    ".next-dev/**",
    // macOS AppleDouble sidecars, created on exFAT volumes
    "**/._*",
  ]),

  {
    /**
     * react-three-fiber's render loop is imperative by design: `useFrame`
     * mutates three.js objects sixty times a second and must never trigger a
     * React render — that is the whole reason the scroll signal is a plain
     * mutable object. The React Compiler lint rules read those callbacks as
     * render-phase code and cannot tell the difference, so they are switched
     * off for the scene only, not for the app.
     */
    files: ["components/three/**/*.tsx", "components/three/**/*.ts"],
    rules: {
      "react-hooks/purity": "off",
      "react-hooks/immutability": "off",
      "react-hooks/refs": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;
