-- Reserva atômica da tentativa de login (spec 001, RN5 · ADR 0014 · achado S3 da T23).
--
-- Problema: a API consultava o bloqueio (login_lock_status), chamava o Supabase e SÓ DEPOIS
-- registrava a falha (register_login_failure), em transações separadas. N requisições em paralelo
-- para o mesmo email liam todas "menos de 5 falhas" e chegavam todas ao Supabase: N senhas testadas
-- por janela de 10 minutos, em vez de 5.
--
-- Agora a tentativa é CONTADA ANTES de chamar o Supabase, com a linha travada (select ... for
-- update): requisições paralelas do mesmo email entram em fila aqui. Login certo zera tudo depois
-- (clear_my_login_failures, da 0005). Senha errada não precisa registrar mais nada.
--
-- Consequência aceita: se o Supabase falhar por outro motivo (fora do ar, limite), a tentativa
-- reservada continua contando. Não existe função para "devolver" a tentativa de propósito: ela
-- teria de ser chamável antes do login, e quem tivesse a chave publicável anularia o bloqueio.

create or replace function public.reserve_login_attempt(p_email text)
returns table (failed_count integer, locked_until timestamptz, allowed boolean)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_hash text := public.login_email_hash(p_email);
  v_row  public.login_attempts;
begin
  -- Limpeza preguiçosa (mesma regra da 0005): falhas com mais de 1 dia deixam de contar como
  -- "seguidas", e a tabela não cresce sem limite.
  delete from public.login_attempts
  where updated_at < now() - interval '1 day'
    and (locked_until is null or locked_until <= now());

  insert into public.login_attempts (email_hash, failed_count)
  values (v_hash, 0)
  on conflict (email_hash) do nothing;

  -- Trava a linha até o fim da transação: as tentativas paralelas do mesmo email esperam aqui.
  select * into v_row from public.login_attempts la where la.email_hash = v_hash for update;

  if v_row.locked_until > now() then
    return query select v_row.failed_count, v_row.locked_until, false;
    return;
  end if;

  update public.login_attempts la set
    failed_count = case when la.locked_until is not null then 1   -- bloqueio expirou: recomeça
                        else la.failed_count + 1 end,
    locked_until = null
  where la.email_hash = v_hash
  returning * into v_row;

  -- A 5ª tentativa ainda vai ao Supabase; se a senha estiver certa, o login zera o bloqueio.
  if v_row.failed_count >= 5 then
    update public.login_attempts la
    set locked_until = now() + interval '10 minutes'
    where la.email_hash = v_hash
    returning * into v_row;
  end if;

  return query select v_row.failed_count, v_row.locked_until, true;
end;
$$;

-- O Supabase concede EXECUTE a anon e authenticated em toda função nova do schema public.
revoke all on function public.reserve_login_attempt(text) from public, anon, authenticated;
-- Antes do login a API roda como anon (role velos_api, 0007).
grant execute on function public.reserve_login_attempt(text) to anon, authenticated;

-- As duas funções antigas saem: a API não as usa mais, e cada função exposta é superfície a menos.
drop function public.login_lock_status(text);
drop function public.register_login_failure(text);
