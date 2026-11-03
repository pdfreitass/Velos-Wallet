# Spec 011 — Deploy em produção

> **O QUE** fazer e **como saber que está pronto.** O detalhe técnico está no [plan.md](plan.md).

- **Etapa do roadmap:** Pré-deploy
- **Status:** Aprovada
- **Data:** 2026-11-02

## Problema

O MVP está pronto no código e nada disso está no ar. O domínio `veloswallet.com.br` está pago e com o DNS a funcionar, o email sai pelo Resend com a cara do produto, mas **não há onde apontar o domínio**.

O Pedro quer **usar o app para si**, de verdade, no celular e no computador, sem divulgar a ninguém. Hoje isso só acontece com dois terminais abertos e `localhost:3000`.

Além do endereço, há coisas que só existem em produção e nunca foram exercitadas: HTTPS de verdade, o proxy à frente da aplicação, o login com Google fora do modo *Teste*, e a sessão sobrevivendo a um redeploy.

## Histórias de usuário

- Como **Pedro**, quero abrir `veloswallet.com.br` no celular e lançar um gasto, para usar o app no dia a dia em vez de rodar dois servidores.
- Como **Pedro**, quero instalar o app na tela inicial do celular, porque a Etapa 8 (PWA) exige HTTPS para o service worker.
- Como **usuário**, quero continuar logado depois de o app ser atualizado, em vez de ser deslogado a cada publicação.

## Escopo

### Dentro
- **Container** com a API e o build do SPA, num processo só, na mesma origem ([ADR 0013](../../adr/0013-api-aspnet-e-front-react-vite.md)).
- **Fly.io, região `gru`** ([ADR 0020](../../adr/0020-host-fly-io-gru.md)), uma máquina.
- **Ajustes de produção na API**, que hoje não existem: chaves do Data Protection persistidas, `ForwardedHeaders` restrito ao proxy, `AllowedHosts` com o domínio.
- **Segredos por `fly secrets`**, nunca em arquivo versionado.
- **Domínio e HTTPS**: `veloswallet.com.br` a apontar para o Fly, com certificado.
- **URLs de redirect** no Supabase Auth, exatas, para o domínio final.
- **Google OAuth** publicado (fora do modo *Teste*), **se** as páginas de política e termos existirem — senão fica registado como bloqueio.

### Fora (explicitamente)
- **Deploy automático por CI.** O `fly deploy` é manual nesta primeira etapa; automatizar depois, quando o processo estiver provado à mão.
- **Mais de uma máquina**, autoscaling, réplicas ou região secundária.
- **Páginas de política de privacidade e termos** (item L1 da auditoria): são trabalho de conteúdo, com spec própria.
- Monitoramento, alertas, agregação de logs.
- Decidir o que fazer com a **Vercel** (fica como pendência).
- Backup do banco: é do Supabase, não deste deploy.

## Regras de negócio

- **RN1** — **Nenhum segredo** entra em arquivo versionado. A connection string, a senha do banco e qualquer chave vão por `fly secrets`, que o Fly entrega como variável de ambiente.
- **RN2** — A connection string de produção usa **`SSL Mode=VerifyFull`** com o certificado do Supabase. Hoje é `Require`, que cifra mas **não valida o servidor**.
- **RN3** — As **chaves do Data Protection** são persistidas num volume. Sem isso, cada redeploy invalida todos os cookies de sessão e todo link de recuperação em andamento.
- **RN4** — O `ForwardedHeaders` aceita cabeçalho **só do proxy do Fly**. Sem isso o limite por IP vê sempre o IP do proxy e passa a ser um limite global.
- **RN5** — `AllowedHosts` é **o domínio**, não `*`.
- **RN6** — O `App__PublicOrigin` é `https://veloswallet.com.br`, e é dele que saem os links dos emails e do OAuth.
- **RN7** — A imagem do container **não contém segredo nenhum**: o que ela tem é código e o build do front.
- **RN8** — O container roda como **usuário sem privilégio**, não como root.

## Telas e estados

Nenhuma tela nova. O que muda é onde o app vive.

| O quê | Como saber que está certo |
|---|---|
| `https://veloswallet.com.br` | Abre o app, com certificado válido e sem aviso do navegador |
| `http://veloswallet.com.br` | Redireciona para HTTPS |
| PWA | Instalável no celular, e o service worker registra (precisa de HTTPS) |

## Critérios de aceite

- [ ] **CA1** — Dado o domínio no ar, quando abro `https://veloswallet.com.br`, então vejo a página inicial com certificado válido.
- [ ] **CA2** — Dado um cadastro meu, quando entro com email e senha, então chego ao painel e vejo os meus dados reais.
- [ ] **CA3** — Dado que estou logado, quando o app é publicado de novo (`fly deploy`), então **continuo logado** (RN3).
- [ ] **CA4** — Dado o app no ar, quando peço recuperação de senha, então o email chega com o link apontando para o **domínio**, e o link funciona.
- [ ] **CA5** — Dado o login com Google, quando entro por ele, então funciona com o domínio final.
- [ ] **CA6** — Dado o celular, quando abro o site e escolho instalar, então o app instala e o service worker fica `activated`.
- [ ] **CA7** — Dado um pedido com `Host` de outro domínio, então a aplicação recusa (RN5).
- [ ] **CA8** — Dada a imagem publicada, quando procuro segredos nela, então não há nenhum (RN7); e o processo não roda como root (RN8).
- [ ] **CA9** — Dado o limite por IP, quando erro a senha várias vezes, então o bloqueio conta **o meu IP**, não o do proxy (RN4).
- [ ] **CA-build** — `dotnet build api`, `dotnet test api`, `typecheck`, `lint` e `build` do `web` passam.

## Perguntas em aberto

- [ ] **Conta no Fly.io e `flyctl`** — decidido em 2026-11-02: **o Pedro ainda não tem conta.** Tudo o que é código e configuração fica pronto e commitado; o `fly deploy` espera pela conta (precisa de cartão, mesmo no plano gratuito) e pelo `flyctl` instalado, que **não está** nesta máquina. Os critérios **CA1 a CA9** só podem ser conferidos depois disso.
- [x] **`www` também?** Decidido em 2026-11-02: **só o domínio nu**, `veloswallet.com.br`. Um certificado, uma entrada de DNS. Quem escrever `www` vê erro — se incomodar, acrescenta-se depois.
- [ ] **Google OAuth** depende das páginas de política e termos (item **L1** da auditoria), que estão fora desta spec. Se não existirem, o login com Google continua restrito aos *test users* e o **CA5** fica por fechar.
