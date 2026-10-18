-- Dashboard (spec 005 · Etapa 6).
--
--  1. Gastos por categoria no mês (RN4): só despesas, somadas no banco (ADR 0006).
--     category_id nulo = "Sem categoria" (a categoria foi excluída, RN11 da spec 002).
--
-- CRÍTICO: security_invoker = on, como as views da 0004. Sem isso a view rodaria com as
-- permissões de quem a criou e devolveria os gastos de TODOS os usuários.

create view public.category_spending
with (security_invoker = on) as
select
  t.user_id,
  date_trunc('month', t.date)::date as month,
  t.category_id,
  sum(t.amount_cents)::bigint as expense_cents
from public.transactions t
where t.type = 'expense'
group by t.user_id, date_trunc('month', t.date), t.category_id;

comment on view public.category_spending is
  'Despesas por categoria e mês. category_id nulo = "Sem categoria". Transferências e receitas ficam fora.';
