# 09 · Estratégia de testes

> Parte do que existe: 60 métodos de teste em xUnit (Domain 14, Application 39, integração 7), nenhum no front. A estratégia mantém o que funciona e preenche as lacunas, sem mudar a arquitetura.

## 1. Pirâmide proposta

| Nível | Ferramenta | Roda onde | O que prova | Estado |
|---|---|---|---|---|
| Unitário Domain | xUnit | CI | Regras puras (hoje: auth; depois: validação de valor/teto, políticas) | existe |
| Unitário Application | xUnit + fakes (`Fakes.cs`) | CI | Handlers: validação, erros, fluxo feliz e de falha | existe (auth) |
| Arquitetura | xUnit (`ArchitectureTests`) | CI | Dependências só para dentro | existe |
| Integração com banco | xUnit + Postgres/Supabase de teste | CI com segredo | RLS, views, FKs, CHECKs, `UserDbSession` | existe (7, só `profiles`) |
| Endpoint da API | xUnit + `WebApplicationFactory` | CI | Fallback privado, CSRF, 404 de `/api`, cabeçalhos, ProblemDetails | **a criar** (A0.4) |
| Unitário do front | Vitest | CI | `currency.ts`, `date.ts`, validações Zod, montagem de meses | **a criar** (A0.3) |
| Componente | Vitest + Testing Library | CI | `MoneyInput`, formulários críticos | a criar (Etapa 4) |
| E2E | Playwright | CI/manual | Fluxos de dinheiro ponta a ponta | a criar (Q1) |
| Manual guiado | Playwright MCP, 375 px, claro/escuro | por etapa | Visual, foco, rolagem | já usado |

## 2. Princípios

1. **Todo recurso novo nasce com o teste de isolamento entre dois usuários** (A não lê, não altera e não apaga nada de B) e com o de "sem sessão = 401".
2. **Teste de integração nunca roda contra o banco de produção.** Exigir banco de teste (A0.5) antes de ampliar a suíte; enquanto isso, só testes que não gravam dados persistentes (os 7 atuais usam transação com rollback, a confirmar no `TestDatabase`).
3. **Regras de dinheiro têm testes de borda numéricos**: 0, 1, 99, centavos, teto, teto+1, valores com milhares.
4. **Teste de propriedade** para o saldo (CT-14): gerar lançamentos aleatórios e comparar `account_balances` com a soma calculada no teste.
5. **Datas e fusos**: fixar o relógio nos testes; incluir virada de mês às 23h30 em UTC-3.
6. **Falhas conhecidas viram teste antes da correção** (FI-01, FI-02 primeiro falham, depois a `0009` os faz passar).
7. **Teste que protege a segurança precisa falhar quando a proteção some** (ex.: criar controller sem `[AllowAnonymous]` e sem login → 401).

## 3. Mapa de cobertura obrigatória por funcionalidade

| Funcionalidade | Unitário | Integração (banco) | Endpoint | Front | E2E |
|---|---|---|---|---|---|
| Contas | validators, regras de tipo/saldo inicial | CT-02, CT-11, CT-12 | 401, 400, 404 | formulário, `MoneyInput` | criar → ver saldo |
| Categorias | cor/ícone válidos | CT-03, CT-11 | idem | `CategoryBadge` | criar e usar |
| Transações | validators, teto, tipo×categoria | CT-04, 06, 07, 12, 13, 14 | idem + paginação | lista, filtros, toque duplo (CT-18) | lançar em ≤ 3 toques |
| Transferências | origem≠destino | CT-01, 09, 10 | idem | pagar fatura | pagar fatura |
| Dashboard | montagem de meses vazios (CT-08) | views: saldos, mês, categoria | leitura | estados loading/vazio/erro | números = soma esperada |
| Metas | progresso, 100%+ | CT-05, CT-17 | idem | barra de progresso | aporte e apagar aporte |
| LGPD | — | exclusão remove só o usuário A | exige reautenticação | confirmação forte | excluir conta |
| Auth (já existe) | ✔ | ✔ parcial | **A0.4** | — | cadastro → painel |

## 4. Conjunto de dados de teste

- Dois usuários fixos (A e B) criados no banco de **teste**, com contas, categorias e transações previsíveis (valores redondos para soma manual).
- Um conjunto "estresse" de ~5.000 transações para verificar paginação e tempo das views (não bloqueia o MVP).
- Nunca usar dados reais; emails de teste com domínio que tenha MX (`@mailinator.com`), nunca `@example.com` (LICOES L20).

## 5. Regressão e portões

| Portão | Quando | Condição |
|---|---|---|
| Pré-commit (manual) | cada task | `typecheck` + `lint` do web, `dotnet build` |
| CI no PR | todo PR | build + todos os testes (exceto integração se sem banco de teste) + build do web |
| Fim de feature | spec concluída | todos os critérios de aceitação marcados; agentes `security` e `qa` sem pendência crítica |
| Antes de produção | uma vez | E2E passando; checklist de deploy; recuperação de senha testada de ponta a ponta (T9) |

## 6. O que **não** testar agora

- Visual pixel-a-pixel (Impeccable/Playwright MCP já cobrem a inspeção manual).
- Carga e estresse além da verificação de paginação.
- Offline (fora do escopo).

## 7. Ordem de implementação dos testes

1. Vitest para `lib/utils` (CT-15, CT-16) e CI (A0.3 + A0.1).
2. Testes de endpoint de auth/fallback (A0.4).
3. Testes de integração das migrations corretivas (FI-01, FI-02) junto da `0009`.
4. A cada etapa: os CT correspondentes, escritos **antes ou junto** do código.
5. E2E (Q1) quando as Etapas 4–6 estiverem prontas.
