/* eslint-disable no-undef */
/* ========================================
   KAAF UNIVERSITY NOTICEBOARD
   Vite Configuration
   Version: 2.0.0
   Author: Boakye Samuel Yiadom
   ======================================== */

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],

  // Server configuration
  server: {
    port: 5173,
    open: true,
    host: true,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, "/api"),
        configure: (proxy) => {
          proxy.on("error", (err) => {
            console.log("Proxy error:", err);
          });
          proxy.on("proxyReq", (proxyReq, req) => {
            console.log("Proxy Request:", req.method, req.url);
          });
          proxy.on("proxyRes", (proxyRes, req) => {
            console.log("Proxy Response:", proxyRes.statusCode, req.url);
          });
        },
      },
      "/socket.io": {
        target: "http://localhost:5000",
        changeOrigin: true,
        ws: true,
        configure: (proxy) => {
          proxy.on("error", (err) => {
            console.log("Socket.IO proxy error:", err);
          });
        },
      },
      "/uploads": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },

  // Build configuration
  build: {
    outDir: "dist",
    sourcemap: true,
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === "production",
        drop_debugger: true,
        pure_funcs: [
          "console.log",
          "console.info",
          "console.debug",
          "console.trace",
        ],
      },
      mangle: {
        safari10: true,
        keep_fnames: false,
        keep_classnames: false,
      },
      format: {
        comments: false,
        beautify: false,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          "react-core": ["react", "react-dom", "react-router-dom"],
          "mui-core": [
            "@mui/material",
            "@mui/icons-material",
            "@emotion/react",
            "@emotion/styled",
          ],
          "mui-x": ["@mui/x-date-pickers", "@date-io/date-fns"],
          charts: ["recharts", "chart.js", "react-chartjs-2"],
          forms: ["react-hook-form", "yup", "@hookform/resolvers"],
          utils: [
            "axios",
            "date-fns",
            "jwt-decode",
            "socket.io-client",
            "xlsx",
          ],
          ui: [
            "lucide-react",
            "framer-motion",
            "react-hot-toast",
            "react-icons",
            "react-loader-spinner",
          ],
          editor: ["react-quill", "react-markdown"],
          pdf: ["@react-pdf/renderer", "qrcode.react"],
          redux: ["@reduxjs/toolkit", "react-redux"],
          testing: [
            "@testing-library/react",
            "@testing-library/jest-dom",
            "@testing-library/user-event",
          ],
        },
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
    chunkSizeWarningLimit: 1000,
    target: "es2020",
    commonjsOptions: {
      include: [/node_modules/],
      extensions: [".js", ".cjs"],
      transformMixedEsModules: true,
    },
  },

  // Preview configuration
  preview: {
    port: 3000,
    host: true,
    open: true,
    strictPort: false,
  },

  // Resolve aliases
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@pages": path.resolve(__dirname, "./src/pages"),
      "@hooks": path.resolve(__dirname, "./src/hooks"),
      "@utils": path.resolve(__dirname, "./src/utils"),
      "@services": path.resolve(__dirname, "./src/services"),
      "@context": path.resolve(__dirname, "./src/context"),
      "@assets": path.resolve(__dirname, "./src/assets"),
      "@styles": path.resolve(__dirname, "./src/styles"),
      "@types": path.resolve(__dirname, "./src/types"),
      "@config": path.resolve(__dirname, "./src/config"),
      "@store": path.resolve(__dirname, "./src/store"),
      "@features": path.resolve(__dirname, "./src/features"),
    },
  },

  // CSS configuration
  css: {
    modules: {
      localsConvention: "camelCase",
      generateScopedName: "[name]__[local]___[hash:base64:5]",
    },
    preprocessorOptions: {
      css: {
        charset: false,
      },
    },
    devSourcemap: true,
  },

  // Define global constants
  define: {
    __APP_VERSION__: JSON.stringify("2.0.0"),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __DEV__: process.env.NODE_ENV !== "production",
  },

  // Optimize dependencies
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "axios",
      "date-fns",
      "@mui/material",
      "@mui/icons-material",
      "@emotion/react",
      "@emotion/styled",
      "recharts",
      "react-hook-form",
      "yup",
      "socket.io-client",
      "jwt-decode",
      "framer-motion",
      "lucide-react",
      "react-hot-toast",
      "react-quill",
      "react-redux",
      "@reduxjs/toolkit",
      "xlsx",
      "react-icons",
      "qrcode.react",
      "@react-pdf/renderer",
      "react-markdown",
      "react-dropzone",
      "react-error-boundary",
      "react-helmet-async",
      "react-loader-spinner",
      "yet-another-react-lightbox",
      "react-beautiful-dnd",
    ],
    exclude: [],
    esbuildOptions: {
      target: "es2020",
      treeShaking: true,
    },
  },

  // Environment variables prefix
  envPrefix: "VITE_",

  // ESBuild options
  esbuild: {
    logOverride: { "this-is-undefined-in-esm": "silent" },
    target: "es2020",
    legalComments: "none",
  },

  // Clear screen on error
  clearScreen: true,

  // Test configuration
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.js",
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "src/test/"],
    },
  },
});
