# Tasks — Spec 009: PWA instalável

> Passos pequenos e verificáveis, a partir do [plan.md](plan.md). Só marcar `[x]` depois de verificar.

- [x] **T1** — `scripts/generate-pwa-icons.ps1` + os 4 PNGs em `web/public/icons/`
  - Verificação: dimensões conferidas pelo script; abrir o maskable no [maskable.app](https://maskable.app) ou no DevTools e ver que o símbolo não é cortado
- [x] **T2** — `web/public/manifest.webmanifest`
  - Verificação: JSON válido; DevTools → *Application → Manifest* sem erros
- [x] **T3** — `web/index.html`: manifest, `apple-touch-icon` e metas do iOS (**avisar as outras sessões antes**)
  - Verificação: `npm run build --prefix web`; os links aparecem no `dist/index.html`
- [x] **T4** — `web/public/sw.js` + registro em `web/src/main.tsx` só em produção (**avisar antes**)
  - Verificação: `typecheck` e `lint`; em `npm run dev` nenhum SW registrado
- [x] **T5** — (offline ainda por conferir no DevTools) Verificação com a API servindo o build (passos 1–5 do plano): `Content-Type` do manifest, instalável no Chrome do PC, logado/deslogado, offline, sem *Cache Storage*
- [ ] **T6** — Aparelhos reais (CA3–CA5) se houver; senão registrar "a validar no deploy". Login com Google no iPhone (P3)
- [ ] **T7** — Revisões `security` e `qa`; `dotnet build api`, `dotnet test api`, `typecheck`, `lint` e `build` do `web`
- [ ] **T8** — ROADMAP, CHANGELOG, LICOES, ARQUITETURA e a nota no SEC-004 (`worker-src 'self'`, `manifest-src 'self'`)

> Até 2026-10-18 havia três sessões em paralelo, com a `velos-wallet-2c` revisando cada task (T1–T4 aprovadas por ela). Desde então, uma sessão só; commit com a autorização do Pedro.

## Registro

| Task | Commit | Observação |
|---|---|---|
| T0 | | Spec aprovada pelo Pedro em 2026-10-18 (P1–P5 conforme a proposta); plano revisado pela `velos-wallet-2c`: aprovado com notas, já incorporadas |
| T1–T4 | (este commit) | Ícones, manifest, `index.html`, `sw.js` + registro em PROD. Revisados pela `velos-wallet-2c` (APROVADO) |
| T5 | — | API servindo o build em `:5090`: manifest `application/manifest+json`, `sw.js` `text/javascript`, ícones `image/png`, sem cookie e fora do fallback; SW `activated`, Cache Storage vazio, console limpo; **ícone de instalar na barra confirmado pelo Pedro** (o handler sem `respondWith` basta, fallback não foi preciso). Falta: teste offline (CA6) |
