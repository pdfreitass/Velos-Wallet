# ADR 0013 — API em ASP.NET Core e front em React + Vite

- **Status:** Aceita (2026-10-12)
- **Data:** 2026-10-12
- **Etapa:** 3 — Autenticação (decidida antes da T10)
- **Substitui:** [ADR 0001](0001-nextjs-15-app-router.md) e, em parte, [ADR 0002](0002-supabase-ssr-rls.md)

## Contexto

O projeto começou em Next.js full-stack (Server Components + Server Actions), mas quem vai manter o código é o Pedro, que trabalha no dia a dia com **C#/.NET e Clean Architecture** e nunca usou TypeScript nem framework de front. Uma stack que o mantenedor não domina vira um código que ele não consegue revisar, corrigir nem evoluir sozinho.

A troca acontece **no meio da Etapa 3**, antes das telas (T10). Até aqui existem o banco (Etapa 2, migrations `0001`–`0006`) e metade da autenticação (middleware, Server Actions e route handlers do Next). É o momento mais barato: depois das Etapas 4 e 5 o custo seria várias vezes maior.

## Decisão

- **Back-end:** API em **ASP.NET Core (.NET 10 LTS)** com **Clean Architecture** (`Domain`, `Application`, `Infrastructure`, `Api`). Todas as regras de negócio e mutações ficam na API.
- **Front-end:** SPA em **React + Vite + TypeScript**, mantendo Tailwind v4 + shadcn/ui ([ADR 0005](0005-tailwind-v4-shadcn-base-ui.md)), Zod, React Hook Form e Recharts. O front fala **só com a API**: não usa o supabase-js nem conhece chave do Supabase.
- **Mesma origem:** em produção a própria API serve o build do Vite (`wwwroot`), então há **um deploy só e nenhum CORS**. Em desenvolvimento o Vite faz proxy das rotas da API.
- **Autenticação:** continua no **Supabase Auth** (email/senha, Google, emails de redefinição), mas **chamado pela API** (REST do GoTrue), nunca pelo navegador. A sessão fica em **cookies `httpOnly`** gravados pela API. O projeto assina os tokens com **ES256**: a API valida o JWT pela chave pública (OpenID Discovery do Supabase), sem segredo guardado, e tira o `user_id` do claim `sub`.
- **Banco:** continua o **Postgres do Supabase em sa-east-1**. O schema segue em **SQL versionado em `supabase/migrations/`** ([ADR 0012](0012-migrations-via-supabase-cli.md)); o acesso a dados na API **não gera migrations**, só mapeia tabelas e views.
- **RLS continua valendo**, como segunda barreira: a API abre uma transação por request, faz `set local role authenticated` e grava os claims do JWT em `request.jwt.claims`, para que `auth.uid()` e as policies funcionem como hoje. A primeira barreira é a camada `Application`, que sempre filtra pelo usuário autenticado.
- **Repositório único:** `api/` (solution .NET), `web/` (Vite) e `supabase/` (migrations, templates) na raiz.

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| Manter Next.js full-stack | O mantenedor não domina TypeScript nem o lado servidor do Next; ele ficaria dependente de ajuda para cada mudança. |
| ASP.NET + manter Next.js no front | O Next teria um servidor próprio redundante com a API, e essa é justamente a parte mais difícil de aprender. |
| ASP.NET + React + Vite em JavaScript | Sem tipos, erros que o compilador pegaria só aparecem rodando. Num app de dinheiro não vale; o TypeScript lembra o C# (mesmo criador). |
| Blazor | Perde o ecossistema React (shadcn/ui, Recharts) e a identidade visual já construída. |
| ASP.NET Core Identity no lugar do Supabase Auth | Obrigaria a refazer Google, emails, redefinição de senha e bloqueio, que o Supabase já entrega. |
| EF Core migrations como dono do schema | Views, triggers, funções e policies de RLS teriam que virar SQL bruto dentro das migrations do EF, e as `0001`–`0006` já aplicadas ficariam duplicadas. |
| API conectando como `postgres`/`service_role`, sem RLS | Um único `where` esquecido vazaria dados de outro usuário. |

## Consequências

- **Positivas:** o token nunca fica acessível ao JavaScript da página (cookie `httpOnly`, proteção contra XSS); o bloqueio de tentativas fica mais difícil de contornar, porque o navegador nem recebe a chave publicável; o código fica numa linguagem e numa arquitetura que o mantenedor domina; as regras de negócio ficam testáveis em C# (testes de unidade na `Application`); o banco, a RLS, as views e o Supabase Auth da Etapa 2 continuam valendo.
- **Negativas / riscos aceitos:**
  - A Vercel não roda .NET: o app (API + SPA) vai para um host em São Paulo (Azure *Brazil South* ou Fly.io `gru`), a definir antes do deploy.
  - Perde-se a maior parte do código da Etapa 3: o middleware, as Server Actions e os route handlers do Next.
  - A API passa a cuidar de cookies, renovação do token e proteção contra CSRF, que antes o `@supabase/ssr` e o Next resolviam. Detalhes na Revisão 2 do plano da spec 001.
  - Depois do "Sair", o access token já emitido continua matematicamente válido até expirar (validação local por chave pública). Os cookies são apagados e o refresh token é revogado no Supabase, então isso só importa se o token tiver vazado antes.
- **O que passa a ser regra (vai para o CLAUDE.md quando aceita):**
  - Dinheiro em C#: `long` em centavos, nunca `decimal`/`double` na persistência; datas do banco como `DateOnly`.
  - Toda query de dados do usuário roda dentro da transação com o role `authenticated` e os claims do JWT.
  - A API usa uma connection string de um role sem `bypassrls`; `service_role` e a secret key nunca no front nem em commit.
  - Validação de entrada na `Application` (FluentValidation); o front valida com Zod só para a experiência do usuário.

## Quando revisitar

- Se o pooler do Supabase não aceitar bem o `set local role` por transação.
- Antes do deploy em produção: escolher o host e medir a latência navegador → API → banco, tudo em São Paulo.
- Se o Supabase mudar o algoritmo ou a rotação das chaves de assinatura do JWT.
