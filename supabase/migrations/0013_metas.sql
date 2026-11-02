-- Metas (spec 006 · Etapa 7).
--
--  1. Pendência T1 do ROADMAP / LICOES L01: goal_contributions ganha updated_at e o trigger
--     set_updated_at, como toda tabela (CA9).
--  2. Nome da meta até 60 caracteres (RN1): a API valida, o banco garante.
--  3. goal_progress ganha, NO FIM (create or replace só aceita coluna nova no fim):
--     contribution_count (RN7), remaining_cents e excess_cents (RN4). Tudo derivado da soma,
--     no banco (ADR 0006). O join também filtra pelo user_id: defesa em profundidade além da RLS.
--
-- Sem check de "prazo no passado" nem de "aporte no futuro": current_date não é imutável e roda
-- em UTC (mesmo motivo da 0011). Essas regras ficam na Application, com America/Sao_Paulo.

-- ---------------------------------------------------------------- dados existentes

-- Parar antes, com mensagem clara, se algum dado já violar a check nova (padrão da 0009).
do $$
begin
  if exists (select 1 from public.goals where length(trim(name)) > 60) then
    raise exception '0013: há metas com nome acima de 60 caracteres';
  end if;
end;
$$;

-- ---------------------------------------------------------------- metas

alter table public.goals add constraint goals_name_length
  check (length(trim(name)) <= 60);

-- ---------------------------------------------------------------- aportes

alter table public.goal_contributions
  add column updated_at timestamptz not null default now();

create trigger goal_contributions_set_updated_at before update on public.goal_contributions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------- progresso

-- CRÍTICO: security_invoker = on (ver 0004). As 6 primeiras colunas ficam na mesma ordem.
create or replace view public.goal_progress
with (security_invoker = on) as
select
  g.id as goal_id,
  g.user_id,
  g.name,
  g.target_cents,
  g.deadline,
  coalesce(sum(c.amount_cents), 0)::bigint as current_cents,
  count(c.id)::int as contribution_count,
  greatest(g.target_cents - coalesce(sum(c.amount_cents), 0), 0)::bigint as remaining_cents,
  greatest(coalesce(sum(c.amount_cents), 0) - g.target_cents, 0)::bigint as excess_cents
from public.goals g
left join public.goal_contributions c on c.goal_id = g.id and c.user_id = g.user_id
group by g.id, g.user_id, g.name, g.target_cents, g.deadline;

comment on view public.goal_progress is
  'Progresso de cada meta: soma, número de aportes, quanto falta e quanto passou do alvo.';
