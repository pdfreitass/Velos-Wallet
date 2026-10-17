import { readFileSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

/**
 * API ASP.NET em desenvolvimento (dotnet run --project api/src/Velos.Api).
 * changeOrigin: false — a forma curta ("/api": url) liga o changeOrigin, e a API
 * receberia Host localhost:5080, diferente do que o navegador vê. Os endereços de
 * volta do Google e do email NÃO dependem disso: vêm de App:PublicOrigin.
 */
const API = { target: "http://localhost:5080", changeOrigin: false };

/**
 * HTTPS opcional para testar pelo celular na rede local (os cookies de sessão são Secure, e só
 * "localhost" conta como seguro em http). Desligado por padrão: liga com
 * VELOS_DEV_PFX=<caminho do .pfx> e VELOS_DEV_PFX_PASS, um certificado autoassinado que fica FORA
 * do repositório. O celular mostra o aviso de certificado uma vez. O login com Google não funciona
 * por esse endereço (não está nas Redirect URLs do Supabase); email e senha funcionam.
 */
const devPfx = process.env.VELOS_DEV_PFX;
const https = devPfx ? { pfx: readFileSync(devPfx), passphrase: process.env.VELOS_DEV_PFX_PASS } : undefined;

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  server: {
    // Porta 3000: é a Site URL / Redirect URL já cadastrada no Supabase (C2).
    port: 3000,
    strictPort: true,
    https,
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
