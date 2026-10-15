import { fileURLToPath, URL } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

/**
 * API ASP.NET em desenvolvimento (dotnet run --project api/src/Velos.Api).
 * changeOrigin: false — a forma curta ("/api": url) liga o changeOrigin, e a API
 * receberia Host localhost:5080. Ela monta os endereços de volta do Google
 * (/auth/callback) e do email (/auth/confirm) a partir do Host, e o Supabase só
 * aceita os de localhost:3000 (C2).
 */
const API = { target: "http://localhost:5080", changeOrigin: false };

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  server: {
    // Porta 3000: é a Site URL / Redirect URL já cadastrada no Supabase (C2).
    port: 3000,
    strictPort: true,
    // Mesma origem também em dev: o navegador só vê localhost:3000 e os
    // cookies httpOnly da API funcionam sem CORS (ADR 0013).
    proxy: {
      "/api": API,
      "/auth/confirm": API,
      "/auth/callback": API,
    },
  },
  build: {
    // Em produção a API serve este build (wwwroot).
    outDir: "dist",
  },
});
