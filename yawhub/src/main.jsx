// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";

// Styles — order matters: variables FIRST, then base → global → mobile fixes
import "./styles/variables.css"; // ✅ CRITICAL FIX: CSS variables must load first
import "./index.css";
import "./styles/global.css";
import "./styles/mobile-fixes.css"; // ✅ Mobile responsive fixes

const isDevelopment = import.meta.env.DEV;
const appName = import.meta.env.VITE_APP_NAME || "KAAF Noticeboard";
const apiUrl = import.meta.env.VITE_API_URL || "/api";
const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

document.title = appName;

if (isDevelopment) {
  console.log(`
  🚀 ${appName}
  📡 API:    ${apiUrl}
  🔌 Socket: ${socketUrl}
  🎨 React   ${React.version}
  📦 Mode:   ${import.meta.env.MODE}
  `);
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found — check your index.html");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AuthProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
