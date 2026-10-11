-- Row Level Security
--
-- Duas regras do CLAUDE.md aplicadas aqui:
--  * policies POR COMANDO (select/insert/update/delete), nao uma "for all"
--  * (select auth.uid()) em subquery — assim o planner avalia a funcao UMA vez
--    por statement em vez de uma vez por linha. Em tabelas com muitas
--    transacoes a diferenca e grande.

alter table public.profiles           enable row level security;
alter table public.accounts           enable row level security;
alter table public.categories         enable row level security;
alter table public.transactions       enable row level security;
alter table public.goals              enable row level security;
alter table public.goal_contributions enable row level security;

-- ---------------------------------------------------------------- profiles
-- Excecao: a PK e o id do utilizador, nao ha coluna user_id.
-- Sem policy de DELETE de proposito: o profile morre com o auth.users (cascade).

create policy "profiles_select_own" on public.profiles
  for select to authenticated using (id = (select auth.uid()));

create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (id = (select auth.uid()));

create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- ---------------------------------------------------------------- restantes
-- Mesmo padrao para todas: so se ve e so se escreve o que e proprio.
-- O WITH CHECK no update impede "doar" uma linha a outro utilizador.

do $$
declare
  t text;
begin
  foreach t in array array['accounts', 'categories', 'transactions', 'goals', 'goal_contributions']
  loop
    execute format($f$
      create policy %1$I on public.%2$I
        for select to authenticated using (user_id = (select auth.uid()));
    $f$, t || '_select_own', t);

    execute format($f$
      create policy %1$I on public.%2$I
        for insert to authenticated with check (user_id = (select auth.uid()));
    $f$, t || '_insert_own', t);

    execute format($f$
      create policy %1$I on public.%2$I
        for update to authenticated
        using (user_id = (select auth.uid()))
        with check (user_id = (select auth.uid()));
    $f$, t || '_update_own', t);

    execute format($f$
      create policy %1$I on public.%2$I
        for delete to authenticated using (user_id = (select auth.uid()));
    $f$, t || '_delete_own', t);
  end loop;
end $$;
