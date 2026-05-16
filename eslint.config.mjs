import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import noHexLiteral from "./src/eslint-rules/no-hex-literal.js";

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
    plugins: { "scca-brand": { rules: { "no-hex-literal": noHexLiteral } } },
    rules: {
      "scca-brand/no-hex-literal": "error",
    },
  },
]);

export default eslintConfig;
