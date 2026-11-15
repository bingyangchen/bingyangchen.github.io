import react from "@vitejs/plugin-react";
import browserslistToEsbuild from "browserslist-to-esbuild";
import { defineConfig } from "vitest/config";
import { profile } from "./src/data/profile.ts";
import { makeSiteMetadata, renderSiteShell } from "./src/siteMetadata.ts";

const metadata = makeSiteMetadata(profile);
const fileNameToMetadata = new Map(Object.entries(metadata.files));

export default defineConfig({
  plugins: [
    react(),
    {
      name: "profile-metadata",
      transformIndexHtml: (html) => renderSiteShell(html, metadata),
      configureServer(server) {
        server.middlewares.use((request, response, next) => {
          const path = request.url?.split("?")[0];
          const file = path ? fileNameToMetadata.get(path.slice(1)) : undefined;
          if (!file || (request.method !== "GET" && request.method !== "HEAD"))
            return next();
          response.setHeader("Content-Type", file.contentType);
          response.end(request.method === "HEAD" ? undefined : file.source);
        });
      },
      generateBundle() {
        for (const [fileName, file] of fileNameToMetadata)
          this.emitFile({ type: "asset", fileName, source: file.source });
      },
    },
  ],
  build: { outDir: "build", assetsInlineLimit: 0, target: browserslistToEsbuild() },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/setupTests.ts"],
    include: ["src/**/*.{test,spec}.{js,jsx,ts,tsx}"],
    exclude: ["src/**/{fixtures,__fixtures__}/**"],
  },
});
