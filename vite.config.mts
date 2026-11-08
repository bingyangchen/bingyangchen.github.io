import react from "@vitejs/plugin-react";
import browserslistToEsbuild from "browserslist-to-esbuild";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  build: { outDir: "build", assetsInlineLimit: 0, target: browserslistToEsbuild() },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/setupTests.ts"],
    include: ["src/**/*.{test,spec}.{js,jsx,ts,tsx}"],
    exclude: ["src/**/{fixtures,__fixtures__}/**"],
  },
});
