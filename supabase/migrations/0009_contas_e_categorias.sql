-- Contas e categorias (spec 002 · Etapa 4).
--
--  1. Cheque especial: a conta corrente pode começar negativa (P1 / RN3).
--  2. Cartão de crédito: o saldo inicial é sempre dívida, nunca positivo (RN3).
--  3. Tamanho dos nomes: conta até 40 e categoria até 30 caracteres (RN2 / RN9).
--  4. Nome de categoria único por tipo SEM diferenciar maiúsculas: "Lazer" = "lazer" (RN9).
--  5. Pendência T11: excluir categoria com transações falhava. A FK
--     (category_id, user_id) on delete set null anulava as DUAS colunas, e user_id é not null.
--     Agora anula só category_id e a transação vira "Sem categoria" (RN11).

-- ---------------------------------------------------------------- dados existentes

-- As checks e o índice novos falhariam no meio da migration se algum dado já os violasse.
-- Melhor parar antes, com uma mensagem que diga o que corrigir.
do $$
begin
  if exists (select 1 from public.accounts
             where length(trim(name)) > 40
                or (type in ('savings', 'cash') and initial_balance_cents < 0)
                or (type = 'credit_card' and initial_balance_cents > 0)) then
    raise exception '0009: há contas com nome acima de 40 caracteres ou saldo inicial fora da regra do tipo';
  end if;

  if exists (select 1 from public.categories where length(trim(name)) > 30) then
    raise exception '0009: há categorias com nome acima de 30 caracteres';
  end if;

  if exists (select 1 from public.categories
             group by user_id, lower(name), type having count(*) > 1) then
    raise exception '0009: há categorias com o mesmo nome (sem diferenciar maiúsculas) e o mesmo tipo';
  end if;
end;
$$;

-- ---------------------------------------------------------------- contas

-- Antes: só o cartão podia ser negativo. Agora o sinal depende do tipo.
alter table public.accounts drop constraint accounts_initial_balance_sign;
alter table public.accounts add constraint accounts_initial_balance_sign check (
  case type
    when 'credit_card' then initial_balance_cents <= 0   -- dívida (ou zero)
    when 'checking'    then true                          -- cheque especial
    else initial_balance_cents >= 0                       -- poupança e dinheiro
  end
);

alter table public.accounts add constraint accounts_name_length
  check (length(trim(name)) <= 40);

-- ---------------------------------------------------------------- categorias

alter table public.categories add constraint categories_name_length
  check (length(trim(name)) <= 30);

-- O unique (user_id, name, type) da 0001 diferencia maiúsculas; este não.
create unique index categories_user_lower_name_type_key
  on public.categories (user_id, lower(name), type);

-- ---------------------------------------------------------------- T11

-- A FK foi criada sem nome explícito na 0001; acha pelo par de colunas em vez de supor o
-- nome gerado pelo Postgres.
do $$
declare
  v_name text;
begin
  select c.conname into v_name
  from pg_constraint c
  where c.conrelid = 'public.transactions'::regclass
    and c.confrelid = 'public.categories'::regclass
    and c.contype = 'f'
    and c.conkey = array[
      (select attnum from pg_attribute where attrelid = 'public.transactions'::regclass and attname = 'category_id'),
      (select attnum from pg_attribute where attrelid = 'public.transactions'::regclass and attname = 'user_id')
    ]::smallint[];

  if v_name is null then
    raise exception '0009: FK (category_id, user_id) de transactions não encontrada';
  end if;

  execute format('alter table public.transactions drop constraint %I', v_name);
end;
$$;

-- Postgres 15+: "set null (coluna)" anula só a categoria; o user_id fica.
alter table public.transactions
  add constraint transactions_category_user_fkey
  foreign key (category_id, user_id)
  references public.categories (id, user_id)
  on delete set null (category_id);
