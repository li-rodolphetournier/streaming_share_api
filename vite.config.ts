import { defineConfig } from "vite";
import path from "path";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react({
      // Optimisations React pour haute performance
      fastRefresh: true,
      babel: {
        plugins: [
          // Optimisations de production
          ["@babel/plugin-transform-react-pure-annotations"],
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    host: true,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        secure: false,
      },
      "/hls": {
        target: "http://localhost:3001",
        changeOrigin: true,
        secure: false,
      },
    },
    // Optimisations pour développement haute performance
    hmr: {
      overlay: false,
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    minify: "terser",
    target: "esnext",
    // Optimisations pour build haute performance
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // Séparation optimisée des chunks
          vendor: ["react", "react-dom"],
          query: ["@tanstack/react-query"],
          ui: ["lucide-react"],
          player: ["hls.js"],
          utils: ["clsx", "tailwind-merge"],
        },
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
    // Configuration pour machines haute performance
    chunkSizeWarningLimit: 1000,
    assetsInlineLimit: 8192,
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "@tanstack/react-query",
      "hls.js",
      "lucide-react",
    ],
    exclude: ["@vite/client", "@vite/env"],
  },
  // Configuration pour développement haute performance
  esbuild: {
    target: "esnext",
    platform: "browser",
  },
});
