-- Triggers: updated_at automatico e criacao do profile no primeiro login.
--
-- Todas as funcoes levam `set search_path = ''` e nomes totalmente
-- qualificados. Sem isso, uma funcao SECURITY DEFINER pode ser enganada por um
-- search_path manipulado — e o advisor do Supabase assinala-o.

-- ---------------------------------------------------------------- updated_at

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_set_updated_at     before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger accounts_set_updated_at     before update on public.accounts
  for each row execute function public.set_updated_at();
create trigger categories_set_updated_at   before update on public.categories
  for each row execute function public.set_updated_at();
create trigger transactions_set_updated_at before update on public.transactions
  for each row execute function public.set_updated_at();
create trigger goals_set_updated_at        before update on public.goals
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------- novo utilizador

-- Cria o profile e semeia as categorias padrao. Feito no banco, com trigger, e
-- nao no codigo da app: assim funciona para qualquer via de registo (email,
-- Google, convite, painel do Supabase) e nunca fica um utilizador sem profile
-- por causa de um erro de rede a meio do fluxo.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, name)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Você'
    )
  );

  insert into public.categories (user_id, name, type, color, icon) values
    (new.id, 'Alimentação', 'expense', '#E8833A', 'utensils-crossed'),
    (new.id, 'Moradia',     'expense', '#4F8DF7', 'house'),
    (new.id, 'Transporte',  'expense', '#7C5CF5', 'car'),
    (new.id, 'Saúde',       'expense', '#E05260', 'heart-pulse'),
    (new.id, 'Lazer',       'expense', '#D94FA8', 'gamepad-2'),
    (new.id, 'Educação',    'expense', '#2F9BB8', 'graduation-cap'),
    (new.id, 'Outros',      'expense', '#6B8075', 'circle-dashed'),
    (new.id, 'Salário',     'income',  '#1C7F54', 'wallet'),
    (new.id, 'Freelance',   'income',  '#2ED38C', 'briefcase'),
    (new.id, 'Outros',      'income',  '#4FA37A', 'circle-dashed');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
