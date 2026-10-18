-- Transações (spec 004 · Etapa 5).
--
--  1. Descrição até 100 caracteres (RN5): a API valida, o banco garante.
--
-- Sem check de "data no futuro" (RN4): current_date não é imutável e roda em UTC, então à noite
-- em São Paulo "hoje" já seria amanhã. A regra fica na Application, com America/Sao_Paulo.

-- ---------------------------------------------------------------- dados existentes

-- Parar antes, com mensagem clara, se algum dado já violar a check nova (padrão da 0009).
do $$
begin
  if exists (select 1 from public.transactions
             where description is not null and length(description) > 100) then
    raise exception '0011: há transações com descrição acima de 100 caracteres';
  end if;
end;
$$;

-- ---------------------------------------------------------------- transações

alter table public.transactions add constraint transactions_description_length
  check (description is null or length(description) <= 100);
