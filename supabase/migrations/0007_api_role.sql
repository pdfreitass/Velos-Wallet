-- Role de login da API ASP.NET (ADR 0013 · spec 001, plano Revisão 2).
--
-- A API conecta com este role e, DENTRO de cada transação, troca para
-- `anon` ou `authenticated` com set_config('role', ..., true), gravando os
-- claims do JWT já validado em request.jwt.claims. Assim auth.uid(), as
-- policies e as views com security_invoker funcionam como no Supabase.
--
-- noinherit:   sozinho, o role não herda nenhum privilégio. Se o código
--              esquecer de abrir a sessão do usuário, a query FALHA
--              (permission denied) em vez de ler dado de alguém: falha fechada.
-- nobypassrls: a RLS vale sempre.
--
-- SEM senha aqui: ela é definida uma única vez fora do git (passo C7 do plano)
-- e fica só no `dotnet user-secrets` / variável de ambiente do host.

create role velos_api with login noinherit nobypassrls;

comment on role velos_api is
  'Login da API ASP.NET. Sem privilégios próprios: só age após set_config(''role'', anon|authenticated, true).';

-- Só pode ASSUMIR estes papéis (set true), nunca herdá-los (inherit false).
grant anon, authenticated to velos_api with inherit false, set true;
