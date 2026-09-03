import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Een parameter die begint met _ is bewust ongebruikt. Komt hier vooral
      // voor bij props die een component wel moet accepteren maar niet nodig
      // heeft, en bij de _prev-parameter van server actions.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrors: "none" },
      ],
    },
  },
  {
    // lib/pdf gebruikt de Image van @react-pdf/renderer, niet die van het web.
    // De toegankelijkheidsregels voor HTML-afbeeldingen slaan daar niet op: een
    // PDF kent geen alt-tekst.
    files: ["lib/pdf/**"],
    rules: {
      "jsx-a11y/alt-text": "off",
    },
  },
]);

export default eslintConfig;
