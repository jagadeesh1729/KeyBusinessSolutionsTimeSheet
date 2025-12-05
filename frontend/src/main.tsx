import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";

// Quick startup health check to confirm backend connectivity.
const healthUrl = `${import.meta.env.VITE_API_BASE_URL || "/api"}/health`;
fetch(healthUrl, { method: "GET" })
  .then(async (res) => {
    const text = await res.text();
    console.info("[health-check] Backend responded", {
      url: healthUrl,
      status: res.status,
      ok: res.ok,
      body: text,
    });
  })
  .catch((err) => {
    console.error("[health-check] Backend unreachable", { url: healthUrl, error: err?.message || String(err) });
  });

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
