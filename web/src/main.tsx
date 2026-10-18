import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router";

import "@fontsource-variable/geist";
import "@/styles/globals.css";

import { queryClient } from "@/lib/api/query-client";
import { router } from "@/router";

const root = document.getElementById("root");
if (!root) throw new Error("Elemento #root não encontrado no index.html");

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);

// PWA instalável (spec 007): o service worker só existe no build de produção, para não interferir
// no HMR do Vite. Sem ele o app funciona igual; a falha fica só no console, sem aviso na tela.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .catch((error: unknown) => console.warn("Service worker não registrado:", error));
  });
}
