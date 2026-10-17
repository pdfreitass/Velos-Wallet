-- Pendência T11, segunda parte (spec 002, RN11).
--
-- A 0009 corrigiu a FK (category_id, user_id), mas transactions tem uma SEGUNDA FK para
-- categories: (category_id, type), criada na 0001 sem ação de exclusão (no action). Ela também
-- impedia apagar uma categoria com transações (23503), como mostrou o teste de integração
-- AccountCategoryRulesTests. Com "set null (category_id)" nas duas, apagar a categoria deixa a
-- transação "Sem categoria" e mantém user_id e type.

alter table public.transactions drop constraint transactions_category_id_type_fkey;

alter table public.transactions
  add constraint transactions_category_id_type_fkey
  foreign key (category_id, type)
  references public.categories (id, type)
  on delete set null (category_id);
