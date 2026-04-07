import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import eslintPluginUnicorn from "eslint-plugin-unicorn";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  eslintPluginUnicorn.configs["flat/recommended"],
  {
    rules: {
      // PascalCase components are standard React/Next.js convention.
      "unicorn/filename-case": "off",
      // React idiomatically uses null (useState, conditional rendering).
      "unicorn/no-null": "off",
      // Allow React-standard abbreviations (props, ref, etc.).
      "unicorn/prevent-abbreviations": [
        "error",
        {
          ignore: [/[Pp]rops$/, /[Rr]ef$/, /^searchParams$/],
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
