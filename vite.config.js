import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  server: { watch: { ignored: ["**/tmp/**", "**/scripts/**", "**/docs/**"] } },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("view-content.json")) return "content";
          if (id.includes("node_modules")) {
            if (/[\\/]three[\\/]/.test(id)) return "three";
            if (/motion/.test(id)) return "motion";
            if (/lucide-react/.test(id)) return "icons";
            return "vendor";
          }
        },
      },
    },
  },
});
