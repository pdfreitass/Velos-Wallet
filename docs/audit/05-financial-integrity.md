# 05 · Integridade financeira

> Base: leitura das migrations `0001`–`0004` e `0008`, dos helpers do front e dos ADRs 4, 6, 7, 8. **Nada foi executado contra o banco.** Os cenários marcados "hipótese" precisam de teste (ver §4 e [09](09-testing-strategy.md)).
> Contexto: ainda não há código que crie contas ou transações; esta análise protege o **desenho** antes de ele virar fluxo.

## 1. O que está correto (preservar)

| Tema | Evidência | Avaliação |
|---|---|---|
| Representação monetária | `bigint` centavos; `amount_cents > 0` (CHECK); sinal vem do `type`; `long` no C#; `number` inteiro no TS | ✔ Sem float em nenhuma camada lida |
| Arredondamento | Não existe: soma de inteiros. `formatCurrency` divide por 100 só para exibir; `parseCurrencyInput` usa só dígitos | ✔ |
| Soma no SQL | `account_balances`, `monthly_summary`, `goal_progress` com `::bigint` | ✔ Evita `numeric` virar string |
| Transferência | Registro único + CHECK de forma (`transfer_account_id` obrigatório, sem categoria, origem ≠ destino) | ✔ Atômica; não entra no resumo mensal |
| Cartão sem dupla contagem | Compra no cartão = despesa; pagamento da fatura = transferência (não é despesa) | ✔ no desenho. Depende da UX (FI-09) |
| Isolamento entre usuários | FKs compostas `(account_id, user_id)`, `(category_id, user_id)` | ✔ Mesmo sem RLS não dá para apontar para conta alheia |
| Tipo × categoria | FK `(category_id, type)` | ✔ Despesa não usa categoria de receita |
| Limites de mês | `date` sem fuso, `date_trunc('month', date)` | ✔ Não sofre com UTC-3 |
| Datas no front | `parseISO`/`format`; nunca `new Date("yyyy-MM-dd")` | ✔ |
| Meta derivada | `goal_progress` soma aportes; sem `current_cents` | ✔ Sem segunda fonte de verdade |

## 2. Achados

| ID | Pri. | Achado | Evidência | Cenário de falha |
|---|---|---|---|---|
| **FI-01** | **P0** | **Apagar conta apaga transações em cascata, inclusive o *outro lado* de uma transferência** | `0001`: `foreign key (account_id, user_id) … on delete cascade` e `foreign key (transfer_account_id, user_id) … on delete cascade` | Usuário transfere R$ 500 da Conta A para a B. Apaga a B. A transferência some (a linha tem B como destino), e **A recupera os R$ 500** sem que o usuário tenha feito nada. Saldo total muda silenciosamente. O mesmo vale para o lado da origem. Hipótese; confirmar por teste |
| **FI-02** | P1 | **Apagar categoria com transações** | `0001`: `foreign key (category_id, user_id) … on delete set null` (T11). `set null` tenta zerar também `user_id` (`not null`) | A exclusão falha com erro de banco → 500 ou mensagem ruim. Correção planejada: `on delete set null (category_id)`. Depois, **testar** que a FK `(category_id, type)` (sem `ON DELETE`) não bloqueia a operação. Hipótese: não bloqueia, porque a verificação é no fim do comando, quando `category_id` já é nulo |
| **FI-03** | P1 | **Saldo inclui lançamentos futuros** | `account_balances` soma todas as linhas, sem filtro de data; não há `status` | Usuário lança o aluguel de dia 5 do mês que vem hoje. O "saldo atual" cai agora. Alternativa: bloquear data futura. É **decisão de produto** (D3) |
| **FI-04** | P1 | **`goal_contributions.date default current_date` usa o fuso do banco** | `0001` | O Supabase roda em UTC (**a confirmar**). Aporte às 22h em Brasília entra como o dia seguinte; um aporte no dia 31 cai no mês seguinte. Regra: **a API sempre grava a data enviada pelo cliente**; o `default` deve sair ou ser irrelevante |
| **FI-05** | P1 | **Aporte de meta não debita conta** | ADR 0008 ("A DEFINIR") | O dinheiro "guardado" na meta continua dentro do saldo total. O usuário vê R$ 3.000 de saldo e R$ 3.000 na meta e entende que tem R$ 6.000. Decisão D4 |
| **FI-06** | P1 | **Duplo envio / sem idempotência** | Não há chave de idempotência nem proteção de UI | Toque duplo ou rede lenta cria duas despesas iguais; o saldo erra e nada acusa. Mitigar na UI (botão desabilitado enquanto pendente) **e** na API (chave `Idempotency-Key` ou janela de dedupe) |
| **FI-07** | P2 | **Sem teto de valor** | `amount_cents > 0` sem máximo; JS seguro até 2⁵³−1 | `parseCurrencyInput` aceita uma string enorme de dígitos e `Number.parseInt` perde precisão acima de 2⁵³. Definir teto no validator e no CHECK (ex.: R$ 1 bi) |
| **FI-08** | P2 | `monthly_summary` só tem meses com movimento | view agrupa linhas existentes | Gráfico de evolução some com meses sem dado. O front/API deve completar com zero |
| **FI-09** | P2 | **Pagar a fatura como despesa dobra o gasto** | Cartão é conta; compra já é despesa | Usuário lança "Fatura do cartão" como despesa em vez de transferência: a despesa é contada duas vezes no mês. Mitigar com ação dedicada "Pagar fatura" (cria transferência) |
| **FI-10** | P2 | Sinais do cartão | `account_balances`: despesa subtrai, transferência de entrada soma | Está coerente (compra → saldo mais negativo; pagamento → sobe). Deve ter teste explícito de sinais |
| **FI-11** | P2 | Editar o `type` de uma transação | CHECK `transactions_transfer_shape` | Mudar receita → transferência exige preencher/limpar `transfer_account_id` e `category_id` juntos. A API deve fazer em um `UPDATE` só e ser testada |
| **FI-12** | P2 | Concorrência | Sem versão de linha | Duas abas editando a mesma transação: vale a última. Aceitável no MVP; registrar |
| **FI-13** | P3 | Sem histórico de alterações | — | Sem trilha para investigar divergência |
| **FI-14** | P3 | Custo de `account_balances` | `left join` + `union all` por consulta, escala com o histórico | Índices existem; revisitar só com volume (já previsto no ADR 0006) |

### 2.1 Possível dupla contagem: onde pode acontecer

1. Pagamento de fatura como despesa (FI-09).
2. Aporte de meta + saldo da conta (FI-05): não é dupla contagem do banco, mas **dupla leitura** pelo usuário.
3. Transferência entre conta e cartão **na mesma data**: sem problema, é um registro só.
4. Edição de transferência trocando origem/destino: um `UPDATE`, sem duplicar. ✔

### 2.2 Saldos × transações

Como o saldo é **derivado** (`initial_balance + soma`), ele não pode divergir da lista de transações. Isso elimina a classe mais comum de bug. O risco restante é a *interpretação* (FI-03, FI-05) e a exclusão em cascata (FI-01), não a aritmética.

## 3. Fusos e limites de mês

- Banco e API trabalham com `date`, sem hora. ✔
- O front usa data local do navegador para "hoje". O servidor **nunca** deve decidir "hoje" do usuário. O Brasil não tem horário de verão desde 2019, o que simplifica; ainda assim, só fixar `America/Sao_Paulo` se o servidor precisar de "hoje" (ex.: view de saldo atual).
- "Mês corrente" no dashboard = chave `yyyy-MM` enviada pelo cliente (`toMonthKey`).

## 4. Cenários de teste para a fase de implementação

Formato: **CT-xx** · pré-condição → ação → resultado esperado. Quem executa: integração (I), unitário (U), E2E (E).

| ID | Cobre | Cenário | Tipo |
|---|---|---|---|
| CT-01 | FI-01 | A→B transferência de R$ 500; tentar excluir B → bloqueado (ou arquivado); saldo de A continua com −R$ 500 | I |
| CT-02 | FI-01 | Excluir conta **sem** movimentos funciona | I |
| CT-03 | FI-02 | Excluir categoria com 3 transações → categoria some, transações ficam com `category_id` nulo, `user_id` intacto | I |
| CT-04 | FI-03 | Despesa com data futura: saldo "atual" segue a regra decidida (D3) | I |
| CT-05 | FI-04 | Aporte enviado com a data do cliente é gravado exatamente; sem data → rejeitado | I |
| CT-06 | FI-06 | Duas requisições idênticas em paralelo → 1 transação (ou a segunda recusada) | I |
| CT-07 | FI-07 | `amount_cents` = 0, negativo, 2⁵³, acima do teto → 400 com mensagem em português | U/I |
| CT-08 | FI-08 | Meses sem movimento aparecem com 0 no gráfico | U |
| CT-09 | FI-10 | Conta corrente 1.000 → compra no cartão 200 → saldo corrente 1.000, cartão −200; pagar fatura 200 → corrente 800, cartão 0; `monthly_summary` despesa = 200 (não 400) | I |
| CT-10 | FI-11 | Alterar receita → transferência: exige destino, limpa categoria; sem destino → 400 | I |
| CT-11 | RLS | Usuário A não lista, não lê por id, não altera e não apaga conta/categoria/transação/meta do B (404, nunca 403 que revele existência) | I |
| CT-12 | RLS | Transação com `account_id` de outro usuário → recusada pela FK composta | I |
| CT-13 | Tipo | Despesa em categoria de receita → recusada | I |
| CT-14 | Soma | Saldos = inicial + receitas − despesas ± transferências, para ≥ 1.000 lançamentos aleatórios (propriedade) | U/I |
| CT-15 | Dinheiro | `parseCurrencyInput("1.234,56")` = 123456; `""` = 0; `"R$ 0,99"` = 99; `formatCurrency(123456)` = `R$ 1.234,56` | U (front) |
| CT-16 | Data | 31/10 às 23h30 em UTC-3: `toDbDate` = `2026-10-31`; `parseDbDate("2026-10-01")` é dia 1 local | U (front) |
| CT-17 | Metas | Apagar aporte reduz `current_cents`; meta 100% não quebra a barra | I/U |
| CT-18 | UI | Toque duplo no salvar → uma só transação | E |

## 5. Recomendações

1. Resolver FI-01 **antes** de existir a tela de excluir conta (migration `0009` + regra na API: arquivar; excluir só se não houver movimentos).
2. Decidir D3 (saldo futuro) e D4 (aporte) **antes** do dashboard e das metas.
3. Colocar teto de valor no validator da API **e** em CHECK do banco.
4. Texto e botão "Pagar fatura" que cria transferência (FI-09).
5. Teste de propriedade para o saldo (CT-14) quando existir a primeira escrita.
