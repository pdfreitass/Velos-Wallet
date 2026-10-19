# 01 · Resumo executivo

> Auditoria de **2026-10-19**, branch `devpedro` (árvore limpa, último commit `3042325`). Feita **só por leitura**: nenhum arquivo existente foi editado, nenhum comando de build/teste/migration foi executado, nenhum dado foi tocado. Os únicos arquivos criados são estes, em `docs/audit/`.
>
> **Limite da auditoria:** "concluída" abaixo significa *código lido + testes existentes + registro nos docs coerentes*. Eu **não reexecutei** `dotnet test`, `typecheck`, `lint`, `build` nem abri o app no navegador. Onde isso importa, está marcado.

## Veredito em uma frase

O Velos Wallet tem uma **fundação de segurança e de modelo de dados muito acima do normal para o estágio** (autenticação completa, RLS valendo em toda query, dinheiro em centavos, agregação no SQL), mas **ainda não é um app financeiro**: não existe nenhuma funcionalidade financeira. Não há tela nem endpoint para criar conta, categoria, transação, transferência ou meta. O `/painel` é uma página provisória com "Olá, {nome}" e "Sair".

O projeto está em **3 de 8 etapas do MVP (38%)**, e o ROADMAP diz a mesma coisa. Não encontrei divergência entre o que a documentação afirma e o que o código mostra.

## Contagem de funcionalidades (detalhe em [03](03-feature-inventory.md))

Universo: 22 itens de produto/plataforma inventariados com evidência.

| Estado | Qtde | Itens |
|---|---|---|
| CONCLUÍDA | 10 | cadastro, login + bloqueio, logout, sessão/renovação, login Google, proteções transversais (privado por padrão, CSRF, limite por IP, cabeçalhos), isolamento por usuário (UserDbSession + RLS), página inicial, tema claro/escuro, helpers de dinheiro/data |
| PARCIALMENTE IMPLEMENTADA | 0 | — |
| APENAS VISUAL | 2 | `/painel` provisório; vitrine da landing (dados fictícios, rotulados) |
| COM PROBLEMAS | 1 | modelo de dados/migrations (3 defeitos conhecidos, 1 deles de integridade) |
| AUSENTE | 8 | contas, categorias (CRUD), transações, transferências, dashboard, metas, PWA, perfil/exportar/excluir conta |
| NÃO VERIFICADA | 1 | recuperação de senha ponta a ponta (CA7 nunca testado) |

Fora dessa contagem, três lacunas de plataforma também **ausentes**: CI, testes do front, observabilidade. O **schema** de contas, categorias, transações e metas existe e está aplicado, mas sem API nem UI por cima.

## Principais riscos

1. **Integridade (P0 quando a Etapa 4 existir):** apagar uma conta apaga em cascata as transações dela, inclusive transferências que *chegam* de outras contas, e o saldo dessas outras contas muda sem aviso ([05 · FI-01](05-financial-integrity.md)).
2. **Segurança antes de produção (P0 para o deploy):** a confirmação de email está desligada. Sem ela, qualquer pessoa cria uma conta com o email de outra. Depende de domínio próprio e SMTP (Resend), ainda não definidos.
3. **Regra de saldo ainda indefinida (P1):** `account_balances` soma lançamentos de qualquer data, inclusive futuros, e não há status pago/pendente. Decidir antes do dashboard.
4. **Fuso horário (P1):** `goal_contributions.date` tem `default current_date`, que usa o fuso do banco (provavelmente UTC). Depois das 21h em Brasília, o aporte cairia no dia seguinte. A API deve sempre enviar a data.
5. **Sem rede de proteção automática (P1):** não há CI e não há **nenhum** teste no front (nem de `formatCurrency`/`parseCurrencyInput`/datas, que são o coração do dinheiro). Também não há teste de endpoint da API.
6. **Promessa de marketing à frente do produto (P2):** a landing diz "Sem loja de apps", mas o PWA (Etapa 8) não existe.

## Pontos fortes (preservar)

- Role `velos_api` sem `bypassrls` e `noinherit`; toda query roda em transação com `role authenticated` + claims; esquecer a sessão **falha fechado** (7 testes de integração cobrem isso).
- Views com `security_invoker`, policies por comando com `(select auth.uid())`, FKs compostas que impedem usar conta/categoria de outro usuário.
- Bloqueio de tentativas atômico (`for update`), sem revelar quais emails têm conta.
- Disciplina de documentação: 16 ADRs, 26 lições, specs com critérios de aceite. As correções de segurança da T23 mostram uma revisão séria.
- Dependências enxutas (14 no front, 5 pacotes NuGet de produção), sem código morto nem TODO/FIXME encontrados.

## Dez prioridades

| # | Prioridade | Pri. | Esforço |
|---|---|---|---|
| 1 | Migration `0009` de correções de schema: T1, T11, política de exclusão/arquivamento de conta ([A0.2](08-implementation-roadmap.md)) | P0 | pequeno |
| 2 | CI no GitHub Actions: build + test + typecheck + lint + build do web | P1 | pequeno |
| 3 | **Etapa 4**: contas e categorias (API + UI), com `MoneyInput` e `CategoryBadge` | P1 | grande |
| 4 | **Etapa 5**: transações e transferências, filtro por mês/categoria, edição e exclusão | P1 | grande |
| 5 | Decidir a regra de saldo (data futura, fuso, "hoje") **antes** do dashboard | P1 | pequeno |
| 6 | Testes do front para dinheiro/data + testes de endpoint da API | P1 | médio |
| 7 | **Etapa 6**: dashboard real (saldo, mês, comparação com o mês anterior, por categoria, cartão) | P1 | grande |
| 8 | Pré-deploy: Resend + confirmação de email, host em São Paulo, `VerifyFull`, `ForwardedHeaders`, chaves do Data Protection | P0 p/ produção | médio |
| 9 | Perfil, exportar dados (CSV/JSON) e excluir conta (LGPD) | P1 | médio |
| 10 | **Etapa 7**: metas, com a decisão "aporte debita conta?" | P1 | médio |

PWA (Etapa 8) e observabilidade vêm logo depois; orçamentos, previsão e relatórios ficam em P2/P3 (ver [07](07-gap-analysis.md)).

## Fases propostas

| Fase | Conteúdo | Depende de |
|---|---|---|
| 0 | Fundação: migration `0009`, CI, testes de front e de endpoint | — |
| 1 | Etapa 4: contas e categorias | 0 |
| 2 | Etapa 5: transações e transferências | 1 |
| 3 | Etapa 6: dashboard | 2 + decisão de saldo |
| 4 | Etapa 7: metas | 0 (e decisão do aporte) |
| 5 | Etapa 8 (PWA) + pré-deploy + LGPD | 3 |
| 6 | Pós-MVP (P2/P3): orçamentos, previsão, relatórios, importação… | MVP validado |

A Fase 4 não depende da 2 ou da 3 tecnicamente (só do schema e da API de base), então pode correr em paralelo se houver quem a faça.

## Documentos produzidos

`01` este resumo · [`02`](02-technical-audit.md) auditoria técnica · [`03`](03-feature-inventory.md) inventário · [`04`](04-financial-requirements.md) requisitos · [`05`](05-financial-integrity.md) integridade financeira · [`06`](06-ui-ux-audit.md) UI/UX · [`07`](07-gap-analysis.md) matriz de lacunas · [`08`](08-implementation-roadmap.md) roadmap · [`09`](09-testing-strategy.md) testes.

## Decisões que dependem de você

Detalhadas no fim do [roadmap](08-implementation-roadmap.md#decisões-que-dependem-de-aprovação). Em resumo:

1. Aprovar a **Fase 0** (hardening) antes da Etapa 4?
2. **Excluir conta**: arquivar e bloquear exclusão com movimentos (recomendado), ou cascata?
3. **Saldo**: lançamento futuro entra no saldo de hoje?
4. **Aporte de meta** debita uma conta?
5. **Novas dependências** (explicação antes de instalar, como o CLAUDE.md exige): Vitest + Testing Library, `Microsoft.AspNetCore.Mvc.Testing`, Recharts (já planejado), Playwright (E2E, mais tarde).
6. **Host de produção** e quando entra o Resend/domínio.
7. **Orçamentos por categoria** entram no MVP ou ficam pós-MVP?
8. Quando fazer **LGPD** (exportar/excluir): antes de abrir ao público?

**Nada será implementado até você aprovar explicitamente.**
