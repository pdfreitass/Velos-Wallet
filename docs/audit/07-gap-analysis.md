# 07 · Matriz de lacunas

> Só entra o que **falta ou está errado**. O que está concluído (autenticação, isolamento, landing, tema, helpers) não aparece, salvo melhorias justificadas.
> Prioridade: **P0** crítico · **P1** alta · **P2** média · **P3** futura. Esforço: **P** pequeno (≤ 1 dia) · **M** médio (2–4 dias) · **G** grande (> 4 dias). Tarefas referem o [roadmap](08-implementation-roadmap.md).
> Esforço é relativo e sem medição de velocidade real do time; usar só para comparar.

## Fundação e plataforma

| Área | Funcionalidade | Estado | Evidências | Lacuna | Recomendação | Pri. | Esf. | Dependências | Risco |
|---|---|---|---|---|---|---|---|---|---|
| Banco | Exclusão de conta preserva integridade | COM PROBLEMAS | `0001` cascata em `account_id` e `transfer_account_id` | Apagar conta altera saldo de outras (FI-01); sem arquivar | `0009`: coluna `archived_at`, regra na API, bloquear exclusão com movimentos | **P0** | P | — | Baixo (tabelas vazias hoje) |
| Banco | Exclusão de categoria com transações | COM PROBLEMAS | T11 | FK tenta anular `user_id` | `0009`: `on delete set null (category_id)` + teste | P1 | P | — | Baixo |
| Banco | `updated_at` em `goal_contributions` | COM PROBLEMAS | T1 | Viola regra do projeto | `0009` | P1 | P | — | Baixo |
| Banco | Datas sem depender do fuso do servidor | COM PROBLEMAS | `current_date` default | FI-04 | Remover/neutralizar default; API exige data | P1 | P | `0009` | Baixo |
| Banco | Teto de valor | AUSENTE | sem máximo | FI-07 | CHECK em `0009` + validator | P2 | P | — | Baixo |
| Qualidade | CI | AUSENTE | sem `.github/` | Regra de "pronto" manual | Workflow com build/test/typecheck/lint/build | P1 | P | — | Baixo |
| Qualidade | Testes do front (dinheiro/data) | AUSENTE | sem runner | Núcleo monetário sem teste | Vitest para `lib/utils` | P1 | P | Aprovar dependência | Baixo |
| Qualidade | Testes de endpoint da API | AUSENTE | sem `WebApplicationFactory` | CSRF, Fallback, 404 `/api` só por leitura | Projeto de testes de API | P1 | M | Aprovar dependência | Baixo |
| Qualidade | Testes de RLS entre dois usuários nas tabelas financeiras | AUSENTE | só `profiles` coberto | Isolamento das novas tabelas não provado | Ampliar `UserDbSessionTests` | P1 | M | Etapa 4 | Médio |
| Dados | Ambiente de teste separado + backup | AUSENTE | um só projeto Supabase | Testes e migrations tocam produção | Projeto de testes / branching; backup | P1 | M | Decisão de custo | Médio |
| Segurança | Confirmação de email | AUSENTE (desligada) | Revisão 1 da spec 001 | S-01 | Resend + domínio, religar | **P0 p/ produção** | M | Domínio, host | Alto |
| Segurança | Checklist de deploy | AUSENTE | ROADMAP | `VerifyFull`, `AllowedHosts`, `ForwardedHeaders`, Data Protection keys, URLs de redirect, Google fora do Teste | Executar o checklist | **P0 p/ produção** | M | Host definido | Alto |
| Segurança | Recuperação de senha comprovada | NÃO VERIFICADA | CA7/T9 | Nunca rodou ponta a ponta; modelo de email incompatível | Corrigir `recovery.html`, testar com SMTP próprio | **P0 p/ produção** | P | Resend | Médio |
| Segurança | CSP completa | AUSENTE | só `frame-ancestors` | S-03 | `default-src 'self'` com testes no Vite/produção | P2 | M | Deploy | Médio (quebra de fontes/estilos inline) |
| Segurança | LGPD: exportar e excluir conta; política de privacidade | AUSENTE | `/api/me` só lê | S-07 | Endpoints + tela + páginas legais | P1 | M | Etapa 5 | Médio |
| Operação | Observabilidade (logs estruturados, correlação, alerta de erro) | AUSENTE | `ILogger` padrão | Sem visão de falha em produção | Logs com `traceId`, health real, erro agregado | P2 | M | Host | Baixo |

## Produto

| Área | Funcionalidade | Estado | Evidências | Lacuna | Recomendação | Pri. | Esf. | Dependências | Risco |
|---|---|---|---|---|---|---|---|---|---|
| App | `AppShell`, navegação, estados base | AUSENTE | `PanelPage` autônoma | UX-F1/F3/F4 | Casca + `Dialog`, `Skeleton`, `EmptyState`, `Toast` | P1 | M | — | Baixo |
| Contas | CRUD de contas | AUSENTE (schema) | `accounts`, `account_balances` | Sem API/UI | Etapa 4 | P1 | G | `0009`, AppShell | Médio |
| Contas | Arquivar conta | AUSENTE | — | Pré-requisito de FI-01 | Etapa 4 | P1 | P | `0009` | Baixo |
| Categorias | CRUD (cor, ícone), arquivar | AUSENTE (seed) | `categories` | Sem API/UI | Etapa 4 | P1 | M | `0009` | Baixo |
| Transações | CRUD, filtro, paginação | AUSENTE (schema) | `transactions` | Coração do produto | Etapa 5 | P1 | G | Contas, categorias | **Alto** (regra de dinheiro) |
| Transações | Lançar em ≤ 3 toques | AUSENTE | PRODUCT.md | UX-F2 | Ação rápida no AppShell | P1 | M | CRUD | Médio |
| Transações | Idempotência / anti-duplo-clique | AUSENTE | — | FI-06 | UI + API | P1 | P | CRUD | Médio |
| Transferências | Entre contas, "pagar fatura" | AUSENTE (schema) | CHECK de forma | Sem API/UI | Etapa 5 | P1 | M | CRUD | Alto (saldo) |
| Saldo | Regra de lançamento futuro | AUSENTE (decisão) | `account_balances` | FI-03 | Decisão D3 antes da Etapa 6 | P1 | P | Decisão | Alto se ignorada |
| Dashboard | Saldo, mês, categoria, comparação, cartão | AUSENTE | `monthly_summary` | Falta view por categoria; Recharts | Etapa 6 | P1 | G | Transações | Médio |
| Metas | CRUD, aportes, progresso | AUSENTE (schema) | `goal_progress` | Aporte × conta (FI-05) | Etapa 7 | P1 | M | `0009`, D4 | Médio |
| PWA | Instalável | AUSENTE | sem manifest | Etapa 8; promessa da landing | Manifest + ícones; sem offline | P2 | P | Dashboard | Baixo |
| Relatórios | Evolução mensal, exportar CSV | AUSENTE | — | Pós-MVP; CSV ligado à LGPD | CSV junto da LGPD | P2 | M | Transações | Baixo |
| Orçamentos | Limite por categoria + alerta | AUSENTE | sem tabela | Pós-MVP | Spec própria depois do MVP | P2 | M | Categorias, transações | Médio |
| Status | Pago/pendente | AUSENTE | — | Pós-MVP; muda saldo | Decidir junto de D3 | P2 | M | Transações | Alto (muda regra de saldo) |
| Importação | CSV/OFX | AUSENTE | — | Reduz fricção de registro | Spec própria | P3 | G | Transações | Alto (dedupe) |
| Recorrência / parcelas / fatura | — | AUSENTE | Fora do MVP | — | Só após MVP validado | P3 | G | — | Alto |
| Open Finance, multi-moeda, colaboração, IA | — | AUSENTE | Fora do escopo | — | Não planejar agora | P3 | G | — | Alto |
