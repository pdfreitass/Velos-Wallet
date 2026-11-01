# 08 · Roadmap de implementação

> **Proposta. Nada aqui foi iniciado e nada começa sem sua aprovação explícita.**
> Respeita o fluxo do CLAUDE.md: cada feature começa por **spec → plan → tasks**, uma task por vez, parando para mostrar. As etapas 4–8 já existem no [ROADMAP](../ROADMAP.md); este plano **não as duplica**: acrescenta a Fase 0 (que não existe lá), detalha o fluxo de cada etapa e encaixa o que falta (LGPD, pré-deploy).
> Esforço: **P** ≤ 1 dia · **M** 2–4 dias · **G** > 4 dias (relativo, sem velocidade medida). IDs de teste (CT-xx) estão em [05](05-financial-integrity.md); estratégia em [09](09-testing-strategy.md).

## Ordem e dependências

```
Fase 0  Fundação ─────────────┬──► Fase 1  Etapa 4 (contas, categorias) ──► Fase 2  Etapa 5 (transações)
(A0.1–A0.4)                   │                                                │
                              │                                                ▼
                              └──► Fase 4  Etapa 7 (metas) ◄── D4        Fase 3  Etapa 6 (dashboard) ◄── D3
                                                                               │
                                                                               ▼
                                                              Fase 5  Etapa 8 (PWA) + pré-deploy + LGPD
                                                                               │
                                                                               ▼
                                                              Fase 6  Pós-MVP (P2/P3)
```

---

## Fase 0 — Fundação (antes de qualquer feature)

### A0.2 · Migration `0009`: correções de schema · **P0** · esforço P
1. **Problema:** FI-01 (cascata apaga o outro lado da transferência), FI-02/T11, T1, FI-04, FI-07.
2. **Objetivo:** o schema não permite perda silenciosa de dinheiro e cumpre as regras do projeto.
3. **Estado atual:** tabelas vazias, então corrigir agora é barato.
4. **Resultado esperado:** conta/categoria com `archived_at`; FK de categoria corrigida; `goal_contributions.updated_at` + trigger; teto de `amount_cents`; sem `default current_date` dependente de fuso.
5. **Envolve:** `supabase/migrations/0009_*.sql` (arquivo **novo**; as aplicadas não se editam), `database.types` se existir.
6. **Dependências:** nenhuma. **Decisão D2** (como tratar exclusão de conta) define o desenho.
7. **Regras de negócio:** conta com movimentos **não** se exclui, só se arquiva; a FK de transferência passa a `on delete restrict` (ou o equivalente que impeça a perda).
8. **Interface:** nenhuma ainda.
9. **Backend/banco:** `alter table … add column archived_at timestamptz`; troca das FKs; `check (amount_cents <= teto)`; `add column updated_at` + trigger `set_updated_at`.
10. **Testes:** CT-01, CT-02, CT-03, CT-05, CT-07 (integração).
11. **Critérios de aceitação:** `npx supabase db push --dry-run` lista só a `0009`; as 3 views continuam `security_invoker`; as 23 policies seguem intactas (nenhuma tabela nova); testes passam.
12. **Riscos:** alterar produção com `db push` (único ambiente). Mitigar com `--dry-run` e revisão de você antes de aplicar.
13. **Pri.:** P0. **Concluída quando:** migration aplicada, ARQUITETURA e ROADMAP (T1, T11) atualizados.

### A0.1 · CI no GitHub Actions · P1 · esforço P
1. **Problema:** a regra "só dizer pronto se passar tudo" depende de lembrar.
2. **Objetivo:** todo PR roda `dotnet build api`, `dotnet test api` (unit; integração só se houver banco de teste), `typecheck`, `lint`, `build` do web.
3. **Estado:** ausente. **Envolve:** `.github/workflows/ci.yml`. **Dependências:** nenhuma (sem nova biblioteca; usa Actions oficiais).
4. **Testes:** o próprio workflow num PR de teste. **Aceitação:** PR com erro de lint fica vermelho; PR limpo, verde. **Riscos:** testes de integração precisam de connection string (segredo do GitHub) e não devem rodar contra produção (ver A0.5). **Concluída quando:** check obrigatório na `main`.

### A0.3 · Testes de front para dinheiro e data · P1 · esforço P
1. **Problema:** `currency.ts` e `date.ts` são o núcleo monetário e não têm teste.
2. **Objetivo:** cobrir CT-15 e CT-16. **Envolve:** `web/src/lib/utils/*.test.ts`, script `test` no `web/package.json`.
3. **Dependência nova (precisa de sua aprovação, D5):** **Vitest** (mesmo ecossistema do Vite, sem config extra). **Testing Library** só quando houver componente crítico (Etapa 4).
4. **Aceitação:** casos de borda (vazio, `0,99`, milhões, fuso). **Concluída quando:** roda no CI (A0.1).

### A0.4 · Testes de endpoint da API · P1 · esforço M
1. **Problema:** `FallbackPolicy`, CSRF, `/api/{**path}`, cabeçalhos e limite por IP só foram verificados à mão.
2. **Objetivo:** projeto `Velos.Api.Tests` com `WebApplicationFactory`; provar: rota nova sem `[AllowAnonymous]` devolve 401, mutação sem header devolve 400, `/api/x` inexistente devolve JSON 404, cabeçalhos presentes.
3. **Dependência nova (D5):** `Microsoft.AspNetCore.Mvc.Testing`.
4. **Aceitação:** teste que **falha** se alguém criar controller público sem querer. **Riscos:** o `Program.cs` exige connection string e `Supabase:*`; usar configuração de teste sem tocar produção.

### A0.5 · Ambiente de teste e backup · P1 · esforço M
Projeto Supabase separado (ou *branching*) para integração e para migrations de ensaio; backup do projeto de produção (plano pago, **custo a decidir**). **Dependência:** D6. **Aceitação:** os testes de integração apontam para o banco de teste; produção só recebe `db push` revisado.

---

## Fase 1 — Etapa 4: Contas e categorias (spec `002`)

### E4.0 · AppShell e componentes base · P1 · esforço M
1. **Problema:** UX-F1/F3/F4/V1. **Objetivo:** casca de navegação (barra inferior no celular, lateral no desktop), `Dialog`/`AlertDialog`, `Skeleton`, `EmptyState`, `Toast`, botões a 44 px (T8).
2. **Envolve:** `web/src/components/ui|shared`, `PanelPage`, `router.tsx`, `globals.css` (remedir contraste ao mexer em token).
3. **Aceitação:** 375 px sem rolagem horizontal; foco visível; claro e escuro. **Testes:** manual com Playwright MCP + eslint-jsx-a11y se já existir (não instalar sem explicar).

### E4.1 · Contas (API + UI) · P1 · esforço G
1. **Problema:** tabela existe, nada acima. **Objetivo:** criar, editar, **arquivar**, excluir (só sem movimentos), listar com saldo.
2. **Fluxo (da API para a tela):** (a) revisar `accounts` e `account_balances`; (b) caso de uso na `Application` (`CreateAccount`, `UpdateAccount`, `ArchiveAccount`, `DeleteAccount`, `ListAccounts`) com FluentValidation; (c) leitura/escrita em `Infrastructure` via `UserDbSession` com SQL parametrizado; (d) controller `api/accounts`; (e) hooks TanStack Query + `MoneyInput`; (f) tela de lista (skeleton/vazio/erro) e formulário.
3. **Regras:** 4 tipos; saldo inicial negativo só em cartão; nome obrigatório e único por usuário entre ativas (decidir); saldo total soma só checking/savings/cash; cartão em card separado.
4. **Banco:** nenhuma tabela nova (usa `0009`). **Testes:** CT-02, CT-11, CT-12; unit dos validators; integração do repositório. **Aceitação:** usuário B não vê nem altera conta de A; excluir conta com movimento é recusado com mensagem clara e oferece arquivar.
5. **Riscos:** regressão na `UserDbSession` (não aninhar sessões). **Concluída quando:** spec com CA verificados, ROADMAP/CHANGELOG/LICOES atualizados.

### E4.2 · Categorias (API + UI) · P1 · esforço M
Mesma ordem de E4.1: CRUD com cor (`#RRGGBB`) e ícone (nome lucide validado contra lista permitida), `CategoryBadge`, arquivar. **Regras:** `type <> 'transfer'`; único `(user_id, name, type)`; excluir com transações coloca `category_id = null`. **Testes:** CT-03, CT-11. **Aceitação:** as 10 categorias padrão aparecem para usuário novo (trigger já faz).

---

## Fase 2 — Etapa 5: Transações

### E5.1 · Transações (CRUD, filtro, paginação) · P1 · esforço G
1. **Problema:** coração do produto ausente. **Objetivo:** criar, editar, excluir, duplicar; filtro por mês, categoria e conta; busca por descrição; paginação por cursor.
2. **Fluxo:** (a) confirmar modelos de conta/categoria da Fase 1; (b) regras: valor `long` > 0 e ≤ teto, data `DateOnly` enviada pelo cliente, categoria do mesmo tipo, conta ativa; (c) casos de uso + FluentValidation; (d) leitura paginada `(date desc, id)` no SQL; (e) `api/transactions`; (f) formulário "novo lançamento" em ≤ 3 toques, valor com `MoneyInput`, data nativa, padrões lembrados; (g) lista com agrupamento por dia e `formatSignedCurrency`; (h) invalidação das queries de saldo.
3. **Idempotência:** botão desabilitado + `Idempotency-Key` ou dedupe (FI-06). **Confirmação:** excluir pede confirmação.
4. **Testes:** CT-06, CT-07, CT-11, CT-12, CT-13, CT-14, CT-15, CT-16, CT-18. **Aceitação:** saldo da conta = inicial + movimentos (CT-14); mês filtrado correto em 31/10 às 23h30.
5. **Riscos:** **alto** (regra de dinheiro). Revisão obrigatória dos agentes `security` e `qa`.

### E5.2 · Transferências e "Pagar fatura" · P1 · esforço M
Transferência como registro único; origem ≠ destino; sem categoria; ação "Pagar fatura" cria a transferência (FI-09). **Testes:** CT-09, CT-10. **Aceitação:** resumo mensal não conta transferência.

---

## Fase 3 — Etapa 6: Dashboard

### E6.1 · Decisão de saldo (D3) · P1 · esforço P
Resolver FI-03 **antes** de codar. Se for "somar só até hoje", `account_balances` não pode usar `current_date` (fuso); preferir **bloquear data futura no MVP** ou separar "saldo atual" e "com lançamentos futuros" em consulta que recebe a data do cliente.

### E6.2 · Dashboard real · P1 · esforço G
1. **Objetivo:** saldo total (sem cartão), card de dívida do cartão, receitas × despesas do mês, resultado, comparação com o mês anterior, gastos por categoria.
2. **Banco (migration nova):** view `category_spending` (`security_invoker`, `sum(...)::bigint`, por usuário/mês/categoria, exclui transferências). Soma **sempre no SQL**.
3. **Biblioteca nova (D5):** **Recharts** (já planejada). Gráfico acessível: valores em texto/tabela, não só cor.
4. **Testes:** CT-08, CT-09, CT-14; unit da montagem de meses vazios. **Aceitação:** números do painel = soma manual de um conjunto de teste; estados loading/vazio/erro; 375 px.
5. **Riscos:** médio (consultas lentas com muito histórico; revisitar ADR 0006 só com volume).

---

## Fase 4 — Etapa 7: Metas

### E7.1 · Metas e aportes · P1 · esforço M
Depende de `0009` (T1) e de **D4** (aporte debita conta?). CRUD de metas, aportes manuais (data do cliente, FI-04), barra de progresso via `goal_progress`, prazo. Se D4 = "debita", o aporte vira transferência para uma conta "reserva" (muda o ADR 0008 → novo ADR). **Testes:** CT-05, CT-17. **Aceitação:** apagar aporte corrige o progresso; meta ≥ 100% não quebra a barra.

---

## Fase 5 — Etapa 8, pré-deploy e LGPD

### E8.1 · PWA instalável · P2 · esforço P
`manifest.webmanifest`, ícones, `theme-color` já existe; **sem offline** (fora do escopo). Alinha a promessa "Sem loja de apps". **Aceitação:** Lighthouse "installable"; sem service worker de cache de dados financeiros.

### D1 · Pré-deploy de produção · **P0 p/ produção** · esforço M
Executar o checklist do ROADMAP: host em São Paulo (D6), `App__PublicOrigin`, `AllowedHosts`, `SSL Mode=VerifyFull`, `ForwardedHeaders` restrito, Data Protection keys persistidas, URLs de redirect exatas, Google fora do modo Teste, **Resend + domínio + confirmação de email ligada**, `recovery.html` corrigido e **T9/CA7 testado de ponta a ponta**. CSP completa (S-03) nesta fase. **Aceitação:** checklist 100% marcado; teste manual de cadastro, confirmação e recuperação em produção. **Riscos:** alto (config errada expõe sessão).

### L1 · Conta, exportar e excluir dados (LGPD) · P1 · esforço M
Editar nome do perfil; **exportar** transações/contas/metas (CSV/JSON); **excluir conta** (remove `auth.users` → cascata já existe nas FKs; exige reautenticação e confirmação forte); páginas de privacidade e termos. **Atenção:** apagar `auth.users` exige operação privilegiada no Supabase Auth (a API não tem `service_role`, por regra) → decidir o mecanismo (função `security definer` restrita ao próprio usuário, ou chamada GoTrue autenticada) em **ADR** antes. **Testes:** usuário A exclui; B intacto; sessão invalidada. **Riscos:** médio-alto.

### O1 · Observabilidade mínima · P2 · esforço M
Logs com `traceId`, `/health` que testa o banco, alerta de erro 5xx, retenção sem PII. **Aceitação:** um 500 forçado aparece no alerta sem dados do usuário.

### Q1 · E2E dos fluxos críticos · P2 · esforço M
Cadastro → conta → lançamento → painel; transferência; excluir conta. **Dependência nova (D5):** Playwright (como pacote de teste; hoje só existe o MCP). Rodar no CI.

---

## Fase 6 — Pós-MVP (somente com spec própria e MVP validado)

| ID | Item | Pri. | Esf. | Observação |
|---|---|---|---|---|
| X1 | Orçamentos por categoria + alertas | P2 | M | Tabela `budgets`, view de consumo, alerta visual no limite; não precisa de recorrência |
| X2 | Status pago/pendente + saldo projetado | P2 | M | Muda a regra de saldo; novo ADR |
| X3 | Evolução mensal e relatórios | P2 | M | Reaproveita `monthly_summary` |
| X4 | Importar extrato CSV/OFX | P3 | G | Dedupe por hash; revisão antes de gravar |
| X5 | Limite de cartão | P3 | P | Coluna `credit_limit_cents` |
| X6 | Recorrência, parcelamento, fatura | P3 | G | Hoje fora do escopo |
| X7 | Notificações push | P3 | M | Depende do PWA |
| X8 | Open Finance, IA, multi-moeda, colaboração | P3 | G | Não recomendado agora |

---

## Decisões que dependem de aprovação

| # | Decisão | Opções | Minha recomendação |
|---|---|---|---|
| D1 | Executar a **Fase 0** antes da Etapa 4? | Sim / Não, direto à Etapa 4 | **Sim** (A0.2, A0.1, A0.3, A0.4; o A0.5 pode esperar até perto do deploy) |
| D2 | **Excluir conta** | Arquivar + bloquear exclusão com movimentos / cascata | **Arquivar + bloquear** |
| D3 | **Saldo e data futura** | Bloquear data futura no MVP / permitir e separar "saldo atual" / status pendente | **Bloquear data futura no MVP**; status pendente em X2 |
| D4 | **Aporte de meta debita conta?** | Não (como hoje) / Sim, como transferência para conta reserva | **Não no MVP**, mas avisar no texto da meta que o aporte não sai do saldo |
| D5 | **Novas dependências** | Vitest · `Microsoft.AspNetCore.Mvc.Testing` · Recharts · Playwright (E2E) | Aprovar as duas primeiras agora; Recharts na Etapa 6; Playwright em Q1 |
| D6 | **Host** (Azure Brazil South ou Fly.io `gru`) e **custo** de staging/backup/Resend | — | Decidir antes de D1 (pré-deploy) |
| D7 | **Orçamentos** no MVP? | Sim / Pós-MVP | **Pós-MVP** (princípio "simples antes de completo") |
| D8 | **LGPD** (exportar/excluir) | Antes de abrir ao público / depois | **Antes de abrir ao público** |
| D9 | Numeração de specs | Usar `002` para Etapa 4 (já reservado no ROADMAP) | Sim |

Responda com o que aprova (por exemplo: "aprovo Fase 0 e Etapa 4, D2=arquivar, D3=bloquear futuro"). Sem isso, eu não começo.
