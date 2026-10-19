# Spec 007 — Fundação (hardening antes das contas)

> **O QUE** fazer e **como saber que está pronto.** O **como** vai no `plan.md`, depois da aprovação desta spec.

- **Etapa do roadmap:** Fase 0 da [auditoria de 2026-10-19](../../audit/08-implementation-roadmap.md) (tarefas A0.2, A0.1, A0.3, A0.4). Vem **antes** da Etapa 4.
- **Status:** **Rascunho** (aguardando aprovação do Pedro)
- **Data:** 2026-10-19
- **Numeração:** 007 (era 004). Os comentários das migrations 0009–0013 já aplicadas no banco usam 002 (contas), 004 (transações), 005 (dashboard) e 006 (metas); 007 evita a colisão.
- **Decisões já tomadas pelo Pedro (2026-10-19):** D1 fazer a Fase 0 antes da Etapa 4 · D2 arquivar conta e bloquear exclusão com movimentos · D3 bloquear data futura no MVP (regra da Etapa 5; aqui só preparamos o banco) · D5 liberadas as bibliotecas **Vitest** e **Microsoft.AspNetCore.Mvc.Testing**.

## Problema

A auditoria achou defeitos no schema que ainda não machucam (tabelas vazias), mas passariam a machucar no dia em que existir a tela de excluir conta: apagar uma conta apaga em cascata o outro lado de uma transferência e muda o saldo de outra conta sem aviso (FI-01). Além disso, não há CI nem teste do núcleo de dinheiro/data no front, nem teste dos endpoints da API. Corrigir isto agora é barato; depois das Etapas 4 e 5, não é.

Liga-se ao princípio **"Dinheiro exato"** da [VISAO](../../VISAO.md).

## Histórias de usuário

- Como **usuária ou usuário**, quero que apagar uma conta nunca altere o saldo de outra, para confiar nos números.
- Como **desenvolvedor**, quero que todo PR rode build, testes, typecheck e lint sozinho, para não depender de lembrar.
- Como **desenvolvedor**, quero testes automáticos do que formata e lê dinheiro e datas, para nunca quebrar um centavo sem perceber.
- Como **desenvolvedor**, quero testes que falhem se uma rota nova ficar pública sem querer, para a regra "privado por padrão" não depender de leitura de código.

## Escopo

### Dentro
1. **Migration `0009`** (arquivo novo; as anteriores não se editam), corrigindo:
   - **FI-01:** exclusão de conta que tenha movimentos passa a ser **recusada** pelo banco (nas duas FKs de `transactions` para `accounts`).
   - **Arquivar:** coluna `archived_at` em `accounts` e `categories`.
   - **FI-02 / T11:** `on delete set null (category_id)` na FK composta de categoria.
   - **T1:** `updated_at` + trigger em `goal_contributions`.
   - **FI-04:** `goal_contributions.date` deixa de ter `default current_date` (a API sempre envia a data).
   - **FI-07:** teto de valor (`amount_cents`, `target_cents`, aporte) por CHECK.
2. **CI** no GitHub Actions: `dotnet build`, `dotnet test`, `typecheck`, `lint` e `build` do web.
3. **Testes do front** com Vitest: `currency.ts` e `date.ts`.
4. **Testes de endpoint da API** (`WebApplicationFactory`): rota privada por padrão, CSRF, 404 JSON em `/api/*`, cabeçalhos de segurança.
5. Testes de integração da `0009` (CT-01, CT-02, CT-03, CT-05, CT-07).

### Fora (explicitamente)
- Qualquer tela, endpoint ou caso de uso de contas, categorias ou transações (Etapa 4 em diante).
- A regra "bloquear data futura" (é validação da API na Etapa 5).
- Ambiente de teste separado e backup (A0.5): fica para antes do deploy.
- Confirmação de email, deploy, LGPD, PWA.
- Testes de componente React e E2E (entram com a Etapa 4 e a tarefa Q1).
- Reintroduzir qualquer item "Fora do MVP" da VISAO.

## Regras de negócio

- **RN1** — Uma conta que tenha **qualquer** transação (como origem ou como destino de transferência) **não pode ser excluída**; só arquivada.
- **RN2** — Excluir o **usuário** (`auth.users`) continua apagando tudo dele. A verificação das FKs de conta é *no fim do comando* (`no action`, não `restrict`), para a cascata do usuário não ser bloqueada por ela mesma. Será exigido por teste.
- **RN3** — Arquivar não apaga nem altera movimentos; o saldo e o histórico da conta arquivada continuam existindo.
- **RN4** — Excluir uma categoria que tem transações deixa essas transações **sem categoria** (`category_id` nulo, `user_id` intacto).
- **RN5** — Toda tabela tem `updated_at` com trigger (inclui `goal_contributions`).
- **RN6** — Nenhuma data de negócio nasce de `current_date`/`now()` do servidor: vem do cliente.
- **RN7** — Valores acima do teto são recusados **no banco**, além do validator da API (na Etapa 4/5).
- **RN8** — O CI nunca usa o banco de produção: sem connection string, os testes de integração são **pulados**, não falham.
- **RN9** — Nenhuma tabela nova nesta spec, então a regra de RLS (4 policies) não muda; as 3 views seguem com `security_invoker`.

## Telas e estados

Esta spec **não cria nem altera telas**. Sem skeleton/vazio/erro a tratar.

## Critérios de aceite

- [ ] **CA1** — Dado uma transferência da conta A para B, quando se tenta excluir B (ou A) no banco, então o `DELETE` falha e nenhum saldo muda. (CT-01)
- [ ] **CA2** — Dado uma conta sem movimentos, quando excluída, então a exclusão funciona. (CT-02)
- [ ] **CA3** — Dado uma categoria com 3 transações, quando excluída, então as 3 ficam com `category_id` nulo e o `user_id` intacto. (CT-03)
- [ ] **CA4** — Dado um usuário com contas e transações, quando o usuário é excluído, então tudo dele é removido sem erro de FK. (RN2)
- [ ] **CA5** — `accounts` e `categories` aceitam `archived_at`; arquivar não muda saldo nem movimentos. (RN3)
- [ ] **CA6** — `goal_contributions` tem `updated_at` e o trigger o atualiza; inserir sem `date` é recusado. (CT-05)
- [ ] **CA7** — Valor 0, negativo e acima do teto é recusado pelo banco. (CT-07)
- [ ] **CA8** — `npx supabase db push --dry-run` lista **só** a `0009`; depois de aplicada, as 3 views continuam `security_invoker` e as 23 policies seguem iguais.
- [ ] **CA9** — O workflow do CI roda em PR e fica **vermelho** com um erro de lint de propósito e **verde** sem ele; sem connection string os testes de integração são pulados.
- [ ] **CA10** — `currency.ts` e `date.ts` têm testes: `parseCurrencyInput("1.234,56")` = 123456, `""` = 0, `"R$ 0,99"` = 99; `formatCurrency(123456)` = `R$ 1.234,56`; `toDbDate` de 31/10 às 23h30 = `2026-10-31`; `parseDbDate("2026-10-01")` é dia 1 local. (CT-15, CT-16)
- [ ] **CA11** — Testes de endpoint: controller sem `[AllowAnonymous]` e sem sessão devolve **401**; mutação em `/api/*` sem `X-Velos-Csrf` devolve **400** `csrf_header_missing`; `/api/inexistente` devolve **404 JSON**; resposta traz `nosniff`, `X-Frame-Options: DENY` e `frame-ancestors 'none'`.
- [ ] **CA12** — Existe um teste que **falha** se alguém criar um controller público sem `[AllowAnonymous]` explícito.
- [ ] **CA-seg** — Nada novo expõe dados: nenhuma policy foi relaxada, nenhum segredo entrou no repositório (a connection string do CI vem de segredo do GitHub, ou nem existe).
- [ ] **CA-build** — `dotnet build api`, `dotnet test api`, `typecheck`, `lint` e `build` do web passam.
- [ ] **CA-docs** — ROADMAP (T1, T11 resolvidas), CHANGELOG, LICOES e ARQUITETURA (tabelas, FKs, `archived_at`) atualizados.

## Perguntas em aberto

Respondo com a opção marcada se você não disser nada em contrário.

- [ ] **Q1 — Teto de valor.** Proposta: **R$ 1 bilhão** por lançamento (`100_000_000_000` centavos), muito acima de qualquer uso pessoal e longe do limite de 2⁵³ do JavaScript. Serve?
- [ ] **Q2 — Nome de conta duplicado.** Hoje `accounts` não tem unicidade de nome. Proposta: **manter assim** nesta spec (decidir na Etapa 4, junto com a tela).
- [ ] **Q3 — Aplicar a `0009` em produção.** É o único banco. Proposta: eu mostro o `db push --dry-run` e o SQL, e **só aplico depois do seu "pode aplicar"**.
- [ ] **Q4 — Testes de integração no CI.** Proposta: no CI eles são **pulados** (RN8); você roda localmente. Ambiente de teste separado fica para a A0.5, antes do deploy.
- [ ] **Q5 — Branch protection na `main`** exigindo o CI verde: configuração do repositório no GitHub, feita por você (eu só crio o workflow). Quer que eu liste os passos?
