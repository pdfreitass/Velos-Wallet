# 04 · Requisitos de um app financeiro pessoal

> Universo de investigação, **não** lista para implementar tudo. Cada item recebe uma classe para o estágio atual do Velos Wallet, à luz de [VISAO.md](../VISAO.md) ("simples antes de completo", fora do escopo do MVP).
>
> **Essencial** = sem isso não é um app financeiro / o MVP não cumpre a visão. **Recomendado** = vale entrar logo depois do MVP ou junto, se barato. **Opcional** = diferencial. **Inadequado agora** = contraria a visão ou o escopo definido.
> **Estado** usa as classes de [03](03-feature-inventory.md).

## A. Dashboard

| Requisito | Classe | Estado | Nota |
|---|---|---|---|
| Saldo total (corrente + poupança + dinheiro) | Essencial | AUSENTE (view pronta) | O cartão fica fora (ADR 0007) |
| Receitas e despesas do mês, resultado | Essencial | AUSENTE (`monthly_summary` pronta) | Precisa preencher meses sem movimento |
| Gastos por categoria | Essencial | AUSENTE | **Falta uma view** `category_spending` (soma no SQL) |
| Comparação com o mês anterior | Recomendado | AUSENTE | Cabe na mesma consulta de `monthly_summary` |
| Dívida do cartão em card separado | Essencial (no escopo) | AUSENTE | Já decidido na Etapa 6 |
| Contas próximas do vencimento | Inadequado agora | — | Exige fatura/vencimento, fora do MVP |
| Previsão de saldo, compromissos futuros | Opcional | AUSENTE | Exige recorrência/parcelas (fora do MVP) ou status pendente |
| Filtro por período | Recomendado | AUSENTE | Seletor de mês basta no MVP |

## B. Receitas e despesas

| Requisito | Classe | Estado | Nota |
|---|---|---|---|
| Criar/editar/excluir receita e despesa | Essencial | AUSENTE (schema pronto) | Meta: ≤ 3 toques para lançar |
| Categoria, conta, data, valor, descrição | Essencial | AUSENTE | `observação` separada da `descrição` é desnecessária no MVP |
| Filtro por mês e categoria | Essencial | AUSENTE | Já no escopo da Etapa 5 |
| Busca por texto | Recomendado | AUSENTE | `ilike` no SQL com índice trigram só se necessário |
| Ordenação e **paginação** | Essencial (paginação) | AUSENTE | Por cursor, desde o início |
| Duplicar lançamento | Recomendado | AUSENTE | Barato e reduz toques |
| Status pago/pendente | Recomendado | AUSENTE | Muda a regra de saldo: decidir antes da Etapa 6 |
| Subcategorias | Opcional | AUSENTE | Contraria "simples antes de completo" |
| Recorrência / parcelamento | Inadequado agora | AUSENTE | Fora do MVP, não reintroduzir no meio de etapa |
| Transferência entre contas | Essencial | AUSENTE (schema pronto) | Registro único |
| Histórico de alterações | Opcional | AUSENTE | Pós-MVP |

## C. Contas

| Requisito | Classe | Estado | Nota |
|---|---|---|---|
| Criar/editar contas (4 tipos) com saldo inicial | Essencial | AUSENTE | CHECK de sinal do saldo inicial já existe |
| Saldo consistente com as transações | Essencial | CONCLUÍDA no SQL (view), sem UI | Ver FI-03 sobre datas futuras |
| Histórico de movimentações por conta | Recomendado | AUSENTE | Lista de transações filtrada por conta |
| **Arquivar** conta | Essencial | AUSENTE | Pré-requisito para tratar exclusão com segurança (FI-01) |
| Excluir conta sem movimentos | Essencial | AUSENTE | — |
| Excluir conta com movimentos | Inadequado | — | Bloquear; oferecer arquivar |

## D. Cartões de crédito

O escopo do MVP trata o cartão como **conta normal** com saldo negativo = dívida. Isso é uma decisão consciente (ADR 0007).

| Requisito | Classe | Estado |
|---|---|---|
| Cartão como conta, dívida em card separado | Essencial (no escopo) | AUSENTE (schema pronto) |
| Pagar fatura = transferência da conta para o cartão | Essencial (no escopo) | AUSENTE |
| Limite total/disponível | Recomendado pós-MVP | AUSENTE (sem coluna) |
| Fechamento, vencimento, faturas futuras | Inadequado agora | Fora do escopo |
| Compras parceladas, estornos | Inadequado agora | Fora do escopo |

## E. Categorias e orçamentos

| Requisito | Classe | Estado | Nota |
|---|---|---|---|
| Categorias personalizadas (nome, cor, ícone) | Essencial | AUSENTE (10 padrão via trigger) | |
| Arquivar categoria | Recomendado | AUSENTE | Evita apagar categoria com histórico |
| Orçamento por categoria + alerta | Recomendado pós-MVP | AUSENTE (sem tabela) | Candidato mais forte de P2; ver [07](07-gap-analysis.md) |

## F. Planejamento

| Requisito | Classe | Estado |
|---|---|---|
| Metas com valor, prazo e aportes manuais | Essencial (no escopo, Etapa 7) | AUSENTE (schema pronto) |
| Reserva de emergência | Opcional | É uma meta com nome; não precisa de recurso próprio |
| Projeção de saldo / cenários | Opcional | AUSENTE |

## G. Relatórios

| Requisito | Classe | Estado |
|---|---|---|
| Receitas × despesas do mês | Essencial | AUSENTE |
| Evolução mensal (últimos 6–12 meses) | Recomendado | AUSENTE (`monthly_summary` serve) |
| Distribuição por categoria | Essencial | AUSENTE |
| **Exportação CSV** | Recomendado (e ligado à LGPD) | AUSENTE |
| Fluxo de caixa, gastos recorrentes | Opcional | AUSENTE |

## H. Experiência de uso

| Requisito | Classe | Estado |
|---|---|---|
| Lançar despesa em ≤ 3 toques | Essencial (princípio de produto) | AUSENTE — exige botão de ação rápida, conta/categoria/data padrão |
| Estados loading/vazio/erro em toda lista | Essencial (regra do projeto) | Sem listas ainda; padrão a seguir existe em `FullPageState` |
| Confirmação de ação destrutiva | Essencial | AUSENTE (nenhuma ação destrutiva existe ainda) |
| Busca global, atalhos de teclado | Opcional | AUSENTE |
| Acessibilidade WCAG AA, 375 px | Essencial | Boa base (ver [06](06-ui-ux-audit.md)) |

## I. Segurança e privacidade

| Requisito | Classe | Estado |
|---|---|---|
| Autenticação, autorização, isolamento, sessão | Essencial | **CONCLUÍDA** |
| Validação no servidor | Essencial | CONCLUÍDA para auth; replicar em cada recurso novo |
| Confirmação de email | Essencial para produção | Desligada (S-01) |
| Excluir conta e dados (LGPD) | Essencial antes do público | AUSENTE |
| Exportar dados (LGPD) | Essencial antes do público | AUSENTE |
| Política de privacidade e termos | Essencial antes do público | **Não encontrada** (não há página); a landing promete "Privado por padrão" |
| Backup e recuperação | Essencial em produção | Não documentado |
| MFA | Opcional | AUSENTE |

## J. Qualidade e confiabilidade

| Requisito | Classe | Estado |
|---|---|---|
| Testes unitários de regra financeira | Essencial | Nenhuma regra financeira existe ainda; helpers do front sem teste |
| Testes de integração com RLS entre dois usuários | Essencial | Há para `profiles`; faltam as demais tabelas |
| Testes de fluxo crítico (E2E) | Recomendado | AUSENTE |
| Integridade referencial | Essencial | Forte, com as falhas da FI-01/FI-02 |
| Tratamento de falha de rede | Essencial | `ApiError(0, "network_error")` no client; sem retentativa nem fila |
| Migrations versionadas | Essencial | CONCLUÍDA |
| Observabilidade | Recomendado | AUSENTE |

## K. Recursos avançados

Custo (C), complexidade (X), risco (R), valor (V) em escala baixo/médio/alto. Nenhum é recomendado para o MVP.

| Recurso | C | X | R | V | Dependências | Recomendação |
|---|---|---|---|---|---|---|
| Importar extrato (CSV/OFX) | B | M | M (duplicidade, categoria) | A | Transações, dedupe por hash | **P2**, depois do MVP; é o maior ganho de "registro em segundos" sem Open Finance |
| Exportar CSV | B | B | B | M | Transações | **P1** (LGPD) |
| Categorização assistida (regras por descrição) | B | M | B | M | Transações, histórico | P3; regras simples antes de IA |
| Notificações (lembrete de lançar, meta) | M | M | B | M | PWA/push, consentimento | P3 |
| PWA instalável | B | B | B | A | Dashboard | **Etapa 8** (já planejada) |
| Offline-first | A | A | A | M | — | **Inadequado** (fora do escopo) |
| Open Finance / integração bancária | A | A | A (regulação, custo, segurança) | A | Dados, parceiro regulado | **Não recomendado** agora; sem justificativa de custo |
| Multi-moeda | M | A | M | B | — | Inadequado (campo `currency` existe, ignorado) |
| Múltiplos perfis / colaboração | M | A | A | M | Reescrita de RLS (`user_id` → espaço) | Não agora; alterar a base de segurança é caro |
| IA financeira | A | A | A (privacidade) | M | — | Não recomendado; contraria "privacidade como promessa" sem desenho cuidadoso |
