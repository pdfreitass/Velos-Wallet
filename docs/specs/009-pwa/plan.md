# Plano — Spec 009: PWA instalável

> **COMO** fazer a [spec.md](spec.md). Sem biblioteca nova, sem migration, sem endpoint novo.

## Resposta à P1 (service worker)

Fonte: [Chrome — *Revisiting Chrome's installability criteria*](https://developer.chrome.com/blog/update-install-criteria) (atualizado em 2023-12):

- **Instalar pelo menu** do navegador **não exige** service worker desde o Chrome **108 (celular)** e **112 (desktop)**.
- O **ícone de instalar na barra de endereço** e o **convite automático** "ainda exigem um `fetch()` handler".

Como a CA2 pede o ícone de instalar no PC, o plano usa um **`sw.js` de ~15 linhas escrito à mão**, sem cache:

- **Não** usa `vite-plugin-pwa` nem Workbox: eles existem para gerar cache offline, que está fora do escopo ([ADR 0010](../../adr/0010-pwa-antes-de-app-nativo.md)). Seriam uma dependência para não usar nada dela.
- O `fetch` handler **não chama `respondWith`**: o navegador segue para a rede como se o SW não existisse. Nenhuma resposta é guardada (RN1, CA-seg).
- **Risco:** o Chrome pode classificar um handler vazio como "no-op" e, no futuro, deixar de contá-lo. Se o painel *Application → Manifest* não mostrar o app como instalável, o fallback é repassar **só as navegações** (`event.respondWith(fetch(event.request))` quando `request.mode === "navigate"`), ainda sem cache e sem tocar em `/api`.
- Registro **só em produção** (`import.meta.env.PROD`), para não interferir no HMR do Vite em desenvolvimento.
- **Revisão (2c):** o Chrome já avisa no console sobre *no-op fetch handler*. Se na T5 o painel não marcar o app como instalável, ir direto ao fallback. Em qualquer versão, o handler **nunca** intercepta `/api/` nem métodos diferentes de `GET`.

## Arquivos

| Arquivo | Mudança | Compartilhado? |
|---|---|---|
| `scripts/generate-pwa-icons.ps1` | **Novo.** Gera os PNGs a partir de `web/public/brand/velos-escuro.png` com `System.Drawing` (já vem no Windows; nada a instalar), redimensionamento bicúbico | não |
| `web/public/icons/icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png` (180) | **Novos**, gerados pelo script e versionados | não |
| `web/public/manifest.webmanifest` | **Novo** | não |
| `web/public/sw.js` | **Novo** | não |
| `web/index.html` | `<head>`: `link rel="manifest"`, `apple-touch-icon`, metas de app do iOS | **sim**: avisar as outras sessões antes |
| `web/src/main.tsx` | Registrar o `sw.js` em produção (~6 linhas) | **sim**: avisar antes |
| `vite.config.ts`, `package.json` | **Nenhuma mudança**: o Vite copia `public/` para `dist/` como está | — |
| API | **Nenhuma mudança**: `UseStaticFiles` roda antes da autenticação (arquivos públicos), e o ASP.NET 10 já mapeia `.webmanifest` (string presente em `Microsoft.AspNetCore.StaticFiles.dll`; confirmar o `Content-Type` na T5) | — |

## Ícones

A arte `velos-escuro.png` (1080×1080) tem fundo verde profundo de ponta a ponta e o símbolo centrado. O canto mais distante do símbolo fica a **33,5%** do centro, dentro do círculo seguro do *maskable* (40%). Por isso **a mesma arte serve para todos os tamanhos**, sem margem extra e sem desenho novo (RN4, P4).

| Arquivo | Tamanho | `purpose` |
|---|---|---|
| `icon-192.png` | 192 | `any` |
| `icon-512.png` | 512 | `any` |
| `icon-maskable-512.png` | 512 | `maskable` (arquivo separado, mesmo conteúdo, para o manifest ficar explícito) |
| `apple-touch-icon.png` | 180 | iOS (sem transparência, que o iOS pintaria de preto) |

O `favicon.ico` atual não muda.

## Manifest

```json
{
  "id": "/",
  "name": "Velos Wallet",
  "short_name": "Velos",
  "description": "Seu dinheiro na direção certa.",
  "lang": "pt-BR",
  "dir": "ltr",
  "start_url": "/painel",
  "scope": "/",
  "display": "standalone",
  "background_color": "#0A2E24",
  "theme_color": "#0A2E24",
  "categories": ["finance"],
  "icons": [ /* os 3 da tabela, com sizes/type/purpose */ ]
}
```

- `start_url: /painel`: a guarda de rota privada já manda para `/entrar` quem não tem sessão (RN3).
- `theme_color` fixo no verde profundo (o tema padrão). No navegador, o script do `index.html` continua trocando a `<meta name="theme-color">` conforme o tema, e o Chrome dá preferência à meta.

## `index.html` (só o `<head>`)

```html
<link rel="manifest" href="/manifest.webmanifest" />
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
<meta name="apple-mobile-web-app-title" content="Velos" />
<meta name="mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black" />
```

A `<meta name="theme-color">` e o script de tema que a troca ficam como estão.

`black` em vez de `black-translucent`: o translúcido põe o conteúdo por baixo da barra de status do iPhone e exigiria `env(safe-area-inset-top)` em todas as telas, o que está fora desta etapa.

## Sessão e login (RN2, P3)

- Mesma origem, mesmos cookies `httpOnly`: nada muda na autenticação.
- iPhone instalado + Google: testar na T6. Se o login terminar no Safari, registrar a limitação no `LICOES.md` (pela sessão que cuida dos docs) e não contornar.

## Verificação (P5)

1. `npm run build --prefix web`, copiar `web/dist/` para `api/src/Velos.Api/wwwroot/` (já está no `.gitignore`) e rodar a API: é o mesmo caminho da produção.
2. `curl -I http://localhost:5080/manifest.webmanifest` → `200`, `Content-Type: application/manifest+json`, sem cookie; `curl -I .../sw.js` → `text/javascript`. Nenhum dos dois pode cair no `MapFallbackToFile` (devolver o `index.html`).
3. Chrome DevTools → *Application → Manifest*: sem erros, ícones carregados, maskable conferido com "Show only the minimum safe area" e app marcado como instalável; Lighthouse sem erro de manifest; *Service workers*: ativo, sem *Cache Storage*. Em `npm run dev`, nenhum SW registrado.
4. Instalar no Chrome do PC (CA2) e abrir logado e deslogado.
5. Sem internet (DevTools *Offline*): estado de erro das telas, sem tela branca (CA6).
6. Android e iPhone (CA3–CA5): pelo HTTPS opcional do Vite na rede local, se houver aparelho; senão ficam marcados como "a validar no deploy".

## Riscos

| Risco | Mitigação |
|---|---|
| Handler vazio deixa de contar para o Chrome | Fallback de repasse só das navegações (acima) |
| SW antigo preso no aparelho depois de uma mudança | O `sw.js` não guarda nada; o navegador revalida o arquivo a cada navegação (padrão `updateViaCache: "imports"`). Para remover no futuro, publicar um `sw.js` que chama `self.registration.unregister()` |
| CSP completa (SEC-004, pendente de deploy) bloquear o SW ou o manifest | Registrar no achado SEC-004: incluir `worker-src 'self'` e `manifest-src 'self'` |
| Login com Google no iOS instalado | P3: limitação documentada |
