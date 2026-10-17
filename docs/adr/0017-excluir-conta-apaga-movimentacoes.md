# ADR 0017 — Excluir conta apaga as movimentações (sem arquivar)

- **Status:** Aceita
- **Data:** 2026-10-17
- **Etapa:** 4 — Contas e categorias ([spec 002](../specs/002-contas-e-categorias/spec.md), P2 e RN6)

## Contexto

Uma conta pode ter receitas, despesas e transferências. Ao excluí-la, alguma coisa precisa acontecer com elas, e a escolha mexe em três lugares:

- **No banco**, `transactions` liga-se a `accounts` por duas chaves: `account_id` (a conta da movimentação, ou a origem da transferência) e `transfer_account_id` (o destino). As duas foram criadas com `on delete cascade` na migration `0001`.
- **Nas transferências**, que são **um registro só** ([ADR 0007](0007-transferencia-registro-unico-e-cartao.md)): apagar a linha tira o dinheiro das duas pontas. Ao excluir a conta A, uma transferência A → B some, e **o saldo de B muda**.
- **Na experiência**: o público da [VISAO](../VISAO.md) quer "simples antes de completo". Um modo "arquivada" exigiria esconder a conta das listas, mas mantê-la nos relatórios, decidir se entra no saldo total e oferecer "desarquivar". Isso é uma funcionalidade inteira, fora do MVP.

O Pedro decidiu a P2 da spec 002: **apagar**, com um aviso detalhado do que acontece.

## Decisão

Excluir uma conta **apaga a conta e todas as movimentações em que ela aparece** (como conta, origem ou destino), pelo `on delete cascade` que já existe no banco. Não há arquivamento nem lixeira.

Como não dá para desfazer, a exclusão passa por um aviso detalhado (RN6), alimentado por `GET /api/accounts/{id}/deletion-impact`:

- quantas receitas, despesas e transferências serão apagadas;
- o nome de cada **outra conta** cujo saldo vai mudar, por causa das transferências que somem;
- que as **metas não são afetadas** (não se ligam a contas: o progresso vem de `goal_contributions`, [ADR 0008](0008-progresso-de-metas-derivado.md));
- que **não dá para desfazer**.

Com movimentações, o botão diz o que faz ("Excluir conta e 12 movimentações") e só ativa depois de marcar "Entendi que isso não pode ser desfeito". Sem movimentações, a confirmação é curta.

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| Arquivar a conta (some das listas, fica no histórico) | É uma funcionalidade inteira: filtros, saldo total, relatórios e "desarquivar". Fora do MVP ("simples antes de completo"). |
| Bloquear a exclusão enquanto houver movimentações | Obriga a apagar uma a uma antes. Para quem quer encerrar uma conta antiga, é trabalho sem valor. |
| Manter as movimentações "sem conta" (`account_id` nulo) | Não faz sentido no modelo: toda movimentação acontece numa conta, e o saldo das outras contas ficaria inexplicável. Exigiria mudar o CHECK das transferências e as views. |
| Lixeira com prazo (apaga de vez depois de N dias) | Precisa de um job agendado e de estado "na lixeira" em todas as consultas. Complexidade alta para o MVP. |

## Consequências

- **Positivas:** o modelo continua simples (sem estado "arquivada" nas consultas e nas views). Não sobra dado órfão, e a soma no SQL ([ADR 0006](0006-agregacao-no-sql-views.md)) segue correta sem filtros extras.
- **Negativas / riscos aceitos:** a exclusão é **irreversível**, e o saldo de outras contas pode mudar sem a pessoa abrir essas contas. O aviso detalhado e a caixa de confirmação existem para isso. Não há backup por usuário para restaurar uma conta excluída por engano.
- **O que passa a ser regra:** toda exclusão que leva outros dados junto mostra **antes** o que vai junto (contagem e efeitos noutros registros), num diálogo com "Cancelar" focado e o botão destrutivo dizendo exatamente o que faz. É o mesmo padrão da exclusão de categoria (RN11), que **não** apaga as movimentações: elas passam a "Sem categoria".

## Quando revisitar

- Se aparecerem pedidos de "desfazer" ou de recuperar uma conta excluída nos testes com usuários.
- Antes de importar extratos (OFX/CSV), quando apagar uma conta passaria a destruir muitos dados de uma vez.
- Se entrarem relatórios de anos anteriores, em que contas encerradas precisam continuar aparecendo.
