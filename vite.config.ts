import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        sw: resolve(__dirname, "src/sw.ts"), // bundle sw separately
      },
      output: {
        entryFileNames: (assetInfo) => {
          if (assetInfo.name === "sw") return "sw.js";
          return "assets/[name].[hash].js";
        },
      },
    },
  },
});
