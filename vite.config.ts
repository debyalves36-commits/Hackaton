import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync } from "node:fs";
export default defineConfig({
  base: "./",
  plugins: [
    {
      name: "development-html-template",
      transformIndexHtml: {
        order: "pre",
        handler: () => readFileSync(new URL("./src/index.template.html", import.meta.url), "utf8"),
      },
    },
    react(),
  ],
  build: {
    rollupOptions: { output: { manualChunks: { charts: ["recharts"] } } },
  },
});
