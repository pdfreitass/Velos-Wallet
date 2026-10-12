-- Bloqueio de tentativas de login (spec 001, RN5 · ADR 0013).
--
-- Regra: 5 senhas erradas seguidas para o mesmo email bloqueiam o login por
-- 10 minutos. Conta QUALQUER email digitado, exista a conta ou nao — senao o
-- bloqueio revelaria quais emails tem conta.
--
-- EXCECAO a regra "toda tabela tem user_id": o registo existe ANTES do login
-- e tambem para emails sem conta. Por isso a tabela nao tem policies e
-- ninguem a le ou escreve diretamente: so pelas funcoes abaixo.
--
-- Privacidade: guarda apenas o sha256 do email normalizado, nunca o email.

-- ---------------------------------------------------------------- tabela

create table public.login_attempts (
  email_hash   text        primary key check (email_hash ~ '^[0-9a-f]{64}$'),
  failed_count integer     not null default 0 check (failed_count >= 0),
  locked_until timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.login_attempts is
  'Contagem de logins errados por email (hash). Sem policies: acesso so pelas funcoes login_*.';

-- Usado na limpeza de registos antigos.
create index login_attempts_updated_at_idx on public.login_attempts (updated_at);

alter table public.login_attempts enable row level security;
-- RLS sem policies ja nega tudo; o revoke e a segunda barreira, porque o
-- Supabase da por omissao privilegios de tabela a anon e authenticated.
revoke all on table public.login_attempts from anon, authenticated;

create trigger login_attempts_set_updated_at before update on public.login_attempts
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------- helper

-- sha256 nativo do Postgres (sem depender da extensao pgcrypto).
create or replace function public.login_email_hash(p_email text)
returns text
language sql
immutable
set search_path = ''
as $$
  select encode(sha256(convert_to(lower(trim(coalesce(p_email, ''))), 'UTF8')), 'hex');
$$;

-- ---------------------------------------------------------------- estado

-- Devolve sempre uma linha. Um bloqueio ja expirado conta como zerado.
create or replace function public.login_lock_status(p_email text)
returns table (failed_count integer, locked_until timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select
    case
      when la.locked_until is not null and la.locked_until <= now() then 0
      else coalesce(la.failed_count, 0)
    end,
    case when la.locked_until > now() then la.locked_until end
  from (select 1) as one
  left join public.login_attempts la
    on la.email_hash = public.login_email_hash(p_email);
$$;

-- ---------------------------------------------------------------- falha

create or replace function public.register_login_failure(p_email text)
returns table (failed_count integer, locked_until timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_hash text := public.login_email_hash(p_email);
  v_row  public.login_attempts;
begin
  -- Limpeza preguicosa: falhas com mais de 1 dia deixam de contar como
  -- "seguidas", e a tabela nao cresce sem limite.
  delete from public.login_attempts
  where updated_at < now() - interval '1 day'
    and (locked_until is null or locked_until <= now());

  insert into public.login_attempts as la (email_hash, failed_count)
  values (v_hash, 1)
  on conflict (email_hash) do update set
    failed_count = case
      when la.locked_until > now() then la.failed_count        -- ainda bloqueado: nao acumula
      when la.locked_until is not null then 1                  -- bloqueio expirou: recomeca
      else la.failed_count + 1
    end,
    locked_until = case when la.locked_until > now() then la.locked_until end
  returning * into v_row;

  if v_row.failed_count >= 5 and v_row.locked_until is null then
    update public.login_attempts
    set locked_until = now() + interval '10 minutes'
    where email_hash = v_hash
    returning * into v_row;
  end if;

  return query select v_row.failed_count, v_row.locked_until;
end;
$$;

-- ---------------------------------------------------------------- limpeza

-- Zera APENAS o registo do email do proprio utilizador logado. Se aceitasse
-- um email como parametro, qualquer um desbloquearia qualquer conta.
-- Chamada depois de um login certo e depois de redefinir a senha.
create or replace function public.clear_my_login_failures()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := (select auth.jwt() ->> 'email');
begin
  if (select auth.uid()) is null or v_email is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  delete from public.login_attempts
  where email_hash = public.login_email_hash(v_email);
end;
$$;

-- ---------------------------------------------------------------- permissoes

-- O Supabase concede EXECUTE a anon e authenticated em toda funcao nova do
-- schema public, por isso o revoke tem de nomear esses papeis explicitamente.
revoke all on function public.login_email_hash(text)        from public, anon, authenticated;
revoke all on function public.login_lock_status(text)       from public, anon, authenticated;
revoke all on function public.register_login_failure(text)  from public, anon, authenticated;
revoke all on function public.clear_my_login_failures()     from public, anon, authenticated;

-- Antes do login (anon) o app precisa de consultar e registar falhas.
grant execute on function public.login_lock_status(text)      to anon, authenticated;
grant execute on function public.register_login_failure(text) to anon, authenticated;
-- Zerar exige estar logado.
grant execute on function public.clear_my_login_failures()    to authenticated;
