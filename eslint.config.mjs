import javascript from "@eslint/js";
import prettier from "eslint-config-prettier";
import jsxAccessibility from "eslint-plugin-jsx-a11y";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import typescript from "typescript-eslint";
import { defineConfig } from "eslint/config";

export default defineConfig([
  { ignores: ["build/**", "coverage/**"] },
  javascript.configs.recommended,
  {
    files: ["**/*.{ts,tsx,mts}"],
    extends: [typescript.configs.recommended],
    rules: {
      "@typescript-eslint/no-empty-object-type": [
        "error",
        { allowInterfaces: "with-single-extends", allowObjectTypes: "always" },
      ],
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
  {
    files: ["src/**/*.{js,jsx,ts,tsx}"],
    extends: [
      react.configs.flat.recommended,
      react.configs.flat["jsx-runtime"],
      jsxAccessibility.flatConfigs.recommended,
    ],
    languageOptions: { globals: globals.browser },
    plugins: { "react-hooks": reactHooks },
    settings: { react: { version: "detect" } },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
  {
    files: ["src/**/*.{test,spec}.{js,jsx,ts,tsx}"],
    languageOptions: { globals: globals.vitest },
  },
  {
    files: ["**/*.mjs", "vite.config.mts"],
    languageOptions: { globals: globals.node },
  },
  {
    files: [
      "scripts/prerender.mjs",
      "scripts/browser-resources.mjs",
      "tests/browser/*.mjs",
    ],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ["src/service-worker.ts"],
    languageOptions: { globals: { ...globals.serviceworker, ...globals.node } },
  },
  prettier,
]);
