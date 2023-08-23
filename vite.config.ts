import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  optimizeDeps: {
    esbuildOptions: {
      // Some packages need this to start properly if they reference global
      define: {
        global: "globalThis",
      },
    },
  },
  plugins: [react()],
});
