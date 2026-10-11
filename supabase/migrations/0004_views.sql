-- Views de agregacao.
--
-- CRITICO: `security_invoker = on`. Por omissao uma view corre com as
-- permissoes de quem a criou, o que faria com que ela DEVOLVESSE OS DADOS DE
-- TODOS OS UTILIZADORES, contornando a RLS das tabelas por baixo. Com
-- security_invoker a RLS de quem consulta e que vale.
--
-- Os sum() levam cast explicito para bigint: sum() sobre bigint devolve
-- numeric, que o PostgREST pode serializar como string.

-- --------------------------------------------------------- saldo por conta

create view public.account_balances
with (security_invoker = on) as
with movements as (
  -- Lado de saida: receita soma, despesa e transferencia subtraem.
  select
    t.account_id,
    case t.type
      when 'income'   then  t.amount_cents
      when 'expense'  then -t.amount_cents
      when 'transfer' then -t.amount_cents
    end as delta
  from public.transactions t
  union all
  -- Lado de entrada da transferencia.
  select t.transfer_account_id, t.amount_cents
  from public.transactions t
  where t.type = 'transfer'
)
select
  a.id   as account_id,
  a.user_id,
  a.name,
  a.type,
  a.initial_balance_cents,
  (a.initial_balance_cents + coalesce(sum(m.delta), 0))::bigint as balance_cents
from public.accounts a
left join movements m on m.account_id = a.id
group by a.id, a.user_id, a.name, a.type, a.initial_balance_cents;

comment on view public.account_balances is
  'Saldo por conta. O "saldo total" da app soma apenas checking/savings/cash — o cartao de credito fica de fora.';

-- --------------------------------------------------------- resumo mensal

create view public.monthly_summary
with (security_invoker = on) as
select
  t.user_id,
  date_trunc('month', t.date)::date as month,
  coalesce(sum(t.amount_cents) filter (where t.type = 'income'), 0)::bigint  as income_cents,
  coalesce(sum(t.amount_cents) filter (where t.type = 'expense'), 0)::bigint as expense_cents
from public.transactions t
where t.type <> 'transfer'   -- transferencia nao e receita nem despesa
group by t.user_id, date_trunc('month', t.date);

-- --------------------------------------------------------- progresso das metas

create view public.goal_progress
with (security_invoker = on) as
select
  g.id as goal_id,
  g.user_id,
  g.name,
  g.target_cents,
  g.deadline,
  coalesce(sum(c.amount_cents), 0)::bigint as current_cents
from public.goals g
left join public.goal_contributions c on c.goal_id = g.id
group by g.id, g.user_id, g.name, g.target_cents, g.deadline;
