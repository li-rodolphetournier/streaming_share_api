import { defineConfig } from "vite";
import path from "path";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Forcer le mode mock en développement si pas de variable d'environnement
  const isMockMode =
    process.env.VITE_MOCK_API === "true" || mode === "development";

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    // Définir les variables d'environnement par défaut
    define: {
      "import.meta.env.VITE_MOCK_API": JSON.stringify(
        isMockMode ? "true" : "false"
      ),
    },
    server: {
      port: 3000,
      host: true,
      // Désactiver le proxy en mode mock
      proxy: isMockMode
        ? undefined
        : {
            "/api": {
              target: "http://localhost:8000",
              changeOrigin: true,
              secure: false,
            },
          },
    },
    build: {
      target: "esnext",
      minify: "terser",
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ["react", "react-dom"],
            query: ["@tanstack/react-query"],
            ui: ["lucide-react", "clsx", "tailwind-merge"],
            streaming: ["hls.js"],
          },
        },
      },
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      },
      chunkSizeWarningLimit: 1000,
    },
    optimizeDeps: {
      include: ["react", "react-dom", "@tanstack/react-query", "axios"],
    },
  };
});
