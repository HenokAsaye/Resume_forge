import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import boundaries from "eslint-plugin-boundaries";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // --- Modular-monolith architecture boundaries ---
  // Classifies every file under src/ into a layer, then enforces who may
  // import whom. Set to "warn" during migration; flip to "error" once all
  // modules exist (Step 6).
  {
    plugins: { boundaries },
    settings: {
      "boundaries/include": ["src/**/*"],
      "boundaries/elements": [
        { type: "app", pattern: "src/app/**" },
        { type: "modules", pattern: "src/modules/*", capture: ["module"] },
        { type: "shared", pattern: "src/shared/**" },
      ],
    },
    rules: {
      "boundaries/dependencies": [
        "error",
        {
          default: "disallow",
          policies: [
            // app composes features + shared
            {
              from: { element: { type: "app" } },
              allow: { to: { element: { types: { anyOf: ["modules", "shared"] } } } },
            },
            // a module may use shared...
            {
              from: { element: { type: "modules" } },
              allow: { to: { element: { type: "shared" } } },
            },
            // ...and ONLY its own module (no cross-module imports)
            {
              from: { element: { type: "modules" } },
              allow: {
                to: {
                  element: {
                    type: "modules",
                    captured: { module: "{{ from.element.captured.module }}" },
                  },
                },
              },
            },
            // shared is domain-agnostic: it may only depend on shared
            {
              from: { element: { type: "shared" } },
              allow: { to: { element: { type: "shared" } } },
            },
          ],
        },
      ],
    },
  },

  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
