-- Velos Wallet — esquema base
--
-- Decisoes registadas no CLAUDE.md:
--  * dinheiro sempre em centavos (bigint), sempre positivo; o sinal vem do `type`
--  * cartao de credito e uma conta normal, mas fica fora do "saldo total"
--  * transferencia e UM registo, com conta de origem e destino
--  * metas nao guardam progresso: ele e derivado de goal_contributions

-- ---------------------------------------------------------------- enums

-- Um unico enum para categorias e transacoes. Tem de ser o mesmo tipo nos dois
-- lados, senao a FK composta (category_id, type) nao e possivel: o Postgres
-- exige tipos iguais. As categorias sao impedidas de ser 'transfer' por CHECK.
create type public.transaction_type as enum ('income', 'expense', 'transfer');

create type public.account_type as enum ('checking', 'savings', 'cash', 'credit_card');

-- ---------------------------------------------------------------- profiles

create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  name        text        not null check (length(trim(name)) > 0),
  currency    text        not null default 'BRL' check (currency ~ '^[A-Z]{3}$'),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is
  'Excecao a regra do user_id: aqui a propria PK e o id do utilizador.';

-- ---------------------------------------------------------------- accounts

create table public.accounts (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid        not null references auth.users (id) on delete cascade,
  name                  text        not null check (length(trim(name)) > 0),
  type                  public.account_type not null,
  initial_balance_cents bigint      not null default 0,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  -- Permite a FK composta em transactions: garante que uma transacao nunca
  -- aponta para a conta de OUTRO utilizador, mesmo que a RLS fosse contornada.
  unique (id, user_id)
);

-- Saldo inicial de cartao de credito e divida: pode ser negativo. Nas restantes
-- contas nao faz sentido comecar negativo.
alter table public.accounts add constraint accounts_initial_balance_sign
  check (type = 'credit_card' or initial_balance_cents >= 0);

create index accounts_user_id_idx on public.accounts (user_id);

-- ---------------------------------------------------------------- categories

create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users (id) on delete cascade,
  name        text        not null check (length(trim(name)) > 0),
  type        public.transaction_type not null check (type <> 'transfer'),
  color       text        not null default '#2ED38C' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  icon        text        not null default 'tag',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (id, user_id),
  -- Alvo da FK composta que impede despesa em categoria de receita.
  unique (id, type),
  -- Nao faz sentido ter duas "Alimentação" de despesa.
  unique (user_id, name, type)
);

create index categories_user_id_idx on public.categories (user_id);

-- ---------------------------------------------------------------- transactions

create table public.transactions (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid        not null references auth.users (id) on delete cascade,
  account_id          uuid        not null,
  category_id         uuid,
  type                public.transaction_type not null,
  amount_cents        bigint      not null check (amount_cents > 0),
  description         text,
  date                date        not null,
  transfer_account_id uuid,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  -- A conta tem de ser do proprio utilizador.
  foreign key (account_id, user_id)
    references public.accounts (id, user_id) on delete cascade,
  foreign key (transfer_account_id, user_id)
    references public.accounts (id, user_id) on delete cascade,
  -- A categoria tem de ser do proprio utilizador...
  foreign key (category_id, user_id)
    references public.categories (id, user_id) on delete set null,
  -- ...e do mesmo tipo da transacao. Com category_id NULL a FK nao dispara,
  -- o que cobre transferencias e transacoes sem categoria.
  foreign key (category_id, type)
    references public.categories (id, type),

  -- Forma de uma transferencia vs. receita/despesa.
  constraint transactions_transfer_shape check (
    (type = 'transfer'
      and transfer_account_id is not null
      and category_id is null
      and transfer_account_id <> account_id)
    or
    (type <> 'transfer' and transfer_account_id is null)
  )
);

create index transactions_user_date_idx     on public.transactions (user_id, date desc);
create index transactions_account_idx       on public.transactions (account_id);
create index transactions_category_idx      on public.transactions (category_id);
create index transactions_transfer_acc_idx  on public.transactions (transfer_account_id);

-- ---------------------------------------------------------------- goals

create table public.goals (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid        not null references auth.users (id) on delete cascade,
  name         text        not null check (length(trim(name)) > 0),
  target_cents bigint      not null check (target_cents > 0),
  deadline     date,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (id, user_id)
);

create index goals_user_id_idx on public.goals (user_id);

create table public.goal_contributions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid        not null references auth.users (id) on delete cascade,
  goal_id      uuid        not null,
  amount_cents bigint      not null check (amount_cents > 0),
  date         date        not null default current_date,
  created_at   timestamptz not null default now(),
  foreign key (goal_id, user_id)
    references public.goals (id, user_id) on delete cascade
);

create index goal_contributions_goal_idx on public.goal_contributions (goal_id);
create index goal_contributions_user_idx on public.goal_contributions (user_id);
