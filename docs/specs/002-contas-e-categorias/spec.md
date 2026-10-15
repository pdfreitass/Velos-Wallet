# Spec 002 — Contas e categorias

> **O QUE** fazer e **como saber que está pronto.** Nada de detalhe técnico aqui: isso vai no [plan.md](plan.md).

- **Etapa do roadmap:** Etapa 4 — Contas e categorias
- **Status:** Aprovada (2026-10-15)
- **Data:** 2026-10-15

## Problema

A primeira pergunta da [VISAO](../../VISAO.md) é **"Quanto eu tenho agora?"**, e a resposta está espalhada entre conta corrente, poupança, dinheiro vivo e cartão de crédito. O objetivo 2 do MVP é **organizar o dinheiro em contas**. Sem contas e categorias, não existe onde lançar uma transação (Etapa 5), nem o que somar no dashboard (Etapa 6).

As 10 categorias padrão já são criadas no cadastro (Etapa 2), mas hoje a pessoa não consegue vê-las nem ajustá-las.

## Histórias de usuário

- Como **usuário**, quero cadastrar minhas contas (corrente, poupança, dinheiro e cartão) com o saldo de hoje, para o app partir da minha situação real.
- Como **usuário**, quero ver o saldo de cada conta num lugar só, para não precisar abrir o app de cada banco.
- Como **usuário**, quero informar quanto devo no cartão sem pensar em sinal de menos, para não errar o lançamento.
- Como **usuário**, quero corrigir o nome ou o saldo inicial de uma conta, para consertar um erro de digitação.
- Como **usuário**, quero excluir uma conta que não uso mais, sabendo exatamente o que vai junto.
- Como **usuário**, quero ver, criar, editar e excluir categorias de receita e de despesa com cor e ícone, para os meus gastos ficarem com a minha cara.

## Escopo

### Dentro
- **Contas:** listar (com saldo atual), criar, editar e excluir. 4 tipos: conta corrente, poupança, dinheiro e cartão de crédito.
- **Categorias:** listar (separadas em despesa e receita), criar, editar e excluir, com cor e ícone escolhidos de listas fixas.
- **Campo de valor em reais** (`MoneyInput`) reutilizável nas próximas etapas.
- **Etiqueta de categoria** (`CategoryBadge`): ícone + nome + cor, reutilizável nas transações.
- **Navegação do app logado:** a pessoa chega a Contas e Categorias a partir do painel (no celular, barra inferior; no desktop, menu lateral). Os itens das etapas seguintes (Transações, Metas) **não aparecem** até existirem.
- Pendências do ROADMAP marcadas para esta etapa: **T8** (alvos de toque de 44 px) e **T11** (excluir categoria com transações falha no banco).

### Fora (explicitamente)
- Transações e transferências (Etapa 5): por isso, nesta etapa o saldo atual de cada conta ainda é igual ao saldo inicial.
- **Saldo total** e card da dívida do cartão (Etapa 6, dashboard).
- Arquivar conta, reordenar contas ou categorias, subcategorias, ícone ou cor livres (fora do MVP: "simples antes de completo").
- Limite, fechamento e vencimento de cartão (fatura está fora do MVP, ver VISAO).
- Multimoeda.

## Regras de negócio

- **RN1 — Tipos de conta:** conta corrente, poupança, dinheiro e cartão de crédito. O tipo **não muda** depois de criada (trocar corrente por cartão mudaria o sentido do saldo e das transações já lançadas).
- **RN2 — Nome da conta:** obrigatório, de 1 a 40 caracteres depois de tirar os espaços das pontas. Pode repetir (duas contas "Nubank", uma corrente e um cartão, são normais).
- **RN3 — Saldo inicial:**
  - Poupança e dinheiro: "Quanto tem nesta conta hoje?". **Zero ou positivo.**
  - Conta corrente: "Quanto tem nesta conta hoje?", com a opção **"Estou no negativo (cheque especial)"**, que guarda o valor digitado como saldo negativo (P1). O valor é sempre digitado positivo; quem decide o sinal é a opção.
  - Cartão de crédito: "Quanto você deve hoje neste cartão?". A pessoa digita um valor **positivo**, e o app guarda como **dívida** (saldo negativo). Zero é permitido (cartão sem dívida).
  - Valor máximo: R$ 999.999.999,99. Sempre em centavos exatos (nenhum arredondamento).
- **RN4 — Saldo atual:** saldo inicial + movimentações (Etapa 5). É sempre calculado, nunca digitado.
- **RN5 — Exibição do saldo:** dinheiro sempre com sinal e/ou ícone, nunca só pela cor. Dívida do cartão aparece como valor negativo, com o rótulo "Fatura atual" ou "Dívida".
- **RN6 — Excluir conta:** apaga a conta **e todas as movimentações dela**, sem arquivar (P2). Antes, um diálogo explica **em detalhe** o que vai acontecer:
  - quantas **receitas**, **despesas** e **transferências** serão apagadas;
  - que as **transferências com outras contas** também somem e, por isso, **o saldo dessas outras contas muda**, citando cada conta afetada pelo nome;
  - que as **metas não são afetadas**;
  - que **não dá para desfazer**.
  Sem movimentações, o diálogo é curto ("Excluir 'Nubank'? Não dá para desfazer."). Com movimentações, o botão diz exatamente o que faz ("Excluir conta e 12 movimentações") e só fica ativo depois que a pessoa marca **"Entendi que isso não pode ser desfeito"**.
- **RN7 — Categorias padrão:** as 10 criadas no cadastro (7 de despesa, 3 de receita) são categorias normais da pessoa: podem ser editadas e excluídas (P3).
- **RN8 — Tipo da categoria:** despesa ou receita. **Não muda** depois de criada (uma transação de despesa não pode passar a apontar para uma categoria de receita).
- **RN9 — Nome da categoria:** obrigatório, de 1 a 30 caracteres; **não pode repetir dentro do mesmo tipo**, sem diferenciar maiúsculas ("Lazer" e "lazer" são a mesma). Pode existir "Outros" de despesa e "Outros" de receita.
- **RN10 — Cor e ícone:** escolhidos de uma **paleta fixa** (cerca de 12 cores, todas com contraste medido nos dois temas) e de uma **lista fixa** de ícones (cerca de 30, os comuns de finanças pessoais). A categoria nunca é identificada só pela cor: sempre aparece com ícone e nome.
- **RN11 — Excluir categoria:** pede confirmação. As movimentações que usavam a categoria **continuam existindo**, e passam a aparecer como **"Sem categoria"**. A confirmação diz quantas são afetadas.
- **RN12 — Privacidade:** cada pessoa só vê, cria, altera e exclui as próprias contas e categorias.

## Telas e estados

Todas em **375 px** e **1440 px**, temas **claro e escuro**, com os estados **carregando (skeleton)**, **vazio**, **erro** e **sucesso**.

| Tela | Rota | Estados obrigatórios | Observações |
|---|---|---|---|
| Contas | `/contas` | skeleton · vazio · erro · lista | Cada conta: ícone do tipo, nome, tipo por extenso e saldo atual. Cartões numa seção separada, "Cartões de crédito". Vazio: "Você ainda não tem contas" + botão "Adicionar conta" |
| Nova conta / editar conta | `/contas/nova`, `/contas/:id` | carregando · erro ao salvar · erro por campo · salvando | Tipo (só na criação), nome e saldo inicial com o texto da RN3 conforme o tipo. Na edição: botão "Excluir conta" |
| Categorias | `/categorias` | skeleton · vazio · erro · lista | Abas ou seções "Despesas" e "Receitas". Cada uma: `CategoryBadge`. Vazio por tipo: "Nenhuma categoria de receita" + "Adicionar" |
| Nova categoria / editar categoria | `/categorias/nova`, `/categorias/:id` | carregando · erro ao salvar · erro por campo · salvando | Tipo (só na criação), nome, cor (paleta) e ícone (grade), com pré-visualização do `CategoryBadge` |
| Confirmação de exclusão | (diálogo) | contando movimentações · excluindo · erro | Texto da RN6 / RN11, botão destrutivo e "Cancelar" com foco inicial |
| Navegação do app | todas as rotas logadas | — | Celular: barra inferior fixa (Início, Contas, Categorias). Desktop: menu lateral. Item atual marcado com mais do que a cor |
| Endereço de conta/categoria inexistente ou de outra pessoa | `/contas/:id` | — | Mesma tela de "não encontrado", sem revelar se o item existe |

Textos da interface em **português do Brasil**, com acento.

## Critérios de aceite

- [ ] **CA1** — Sem contas, `/contas` mostra o estado vazio com "Adicionar conta"; depois de criar uma conta corrente "Nubank" com R$ 1.234,56, ela aparece na lista com R$ 1.234,56.
- [ ] **CA1b** — Ao criar uma conta corrente com R$ 350,00 e "Estou no negativo (cheque especial)" marcado, a lista mostra **-R$ 350,00**; poupança e dinheiro não oferecem a opção, e a API recusa saldo inicial negativo para elas.
- [ ] **CA2** — Ao criar um cartão de crédito com "Quanto você deve hoje" = R$ 640,90, a lista mostra o cartão na seção "Cartões de crédito" com **-R$ 640,90** (sinal e rótulo, não só a cor).
- [ ] **CA3** — O campo de valor aceita só números, mostra "R$ 1.234,56" enquanto digita, e o valor salvo é exato em centavos (digitar 0,10 + salvar + reabrir mostra 0,10).
- [ ] **CA4** — Nome vazio, só espaços ou com mais de 40 caracteres é recusado com mensagem no campo, no formulário **e** na API.
- [ ] **CA5** — Editar nome e saldo inicial de uma conta atualiza a lista; o tipo não pode ser trocado.
- [ ] **CA6** — Excluir uma conta sem movimentações pede confirmação curta; confirmada, a conta some da lista.
- [ ] **CA6b** — Com movimentações (preparadas por SQL nesta etapa, já que as telas de transação chegam na Etapa 5), o diálogo mostra o número de receitas, despesas e transferências, o nome de cada outra conta cujo saldo vai mudar, que as metas não são afetadas e que não dá para desfazer; o botão só fica ativo depois de marcar "Entendi que isso não pode ser desfeito".
- [ ] **CA7** — `/categorias` mostra as 10 categorias padrão (7 despesas, 3 receitas), cada uma com ícone, nome e cor.
- [ ] **CA8** — Criar a categoria de despesa "Pets" com cor e ícone escolhidos: ela aparece na lista com a pré-visualização igual à da tela de criação.
- [ ] **CA9** — Criar "lazer" de despesa quando "Lazer" de despesa já existe é recusado ("Você já tem uma categoria de despesa com esse nome"); criar "Lazer" de receita é aceito.
- [ ] **CA10** — Excluir uma categoria pede confirmação; confirmada, ela some. (Com transações, que só existem a partir da Etapa 5, elas passam a "Sem categoria": testado por SQL nesta etapa, ver T11.)
- [ ] **CA11** — Abrir `/contas/<id de outra pessoa>` ou `/categorias/<id inexistente>` mostra "não encontrado"; a API responde 404 nos dois casos, sem distinguir.
- [ ] **CA12** — A navegação leva a Início, Contas e Categorias; no celular a barra inferior não cobre o último item da lista.
- [ ] **CA-seg** — Um usuário não consegue ler, criar, alterar nem excluir contas e categorias de outro (RLS + filtro da API), inclusive mandando o `id` alheio direto para a API. O agente `security` aprova.
- [ ] **CA-a11y** — Funciona em 375 px, nos dois temas; todo alvo de toque com pelo menos 44 px (T8); cor de categoria e de saldo nunca é a única informação; diálogo de exclusão com foco preso e "Esc" fecha; contraste ≥ 4,5:1 em todo texto, inclusive o nome sobre a cor da categoria.
- [ ] **CA-build** — `dotnet build api`, `dotnet test api`, `npm run typecheck`, `npm run lint` e `npm run build` passam; o agente `qa` aprova.

## Decisões (perguntas resolvidas em 2026-10-15)

- [x] **P1 — Cheque especial:** **sim**, a conta corrente pode começar negativa (RN3). Exige migration nova.
- [x] **P2 — Excluir conta com movimentações:** **apagar**, com aviso detalhado do que acontece (RN6).
- [x] **P3 — Categorias padrão:** **podem ser excluídas**; as movimentações viram "Sem categoria" (RN7, RN11).
- [x] **P4 — Início:** `/painel` continua com "Olá, {nome}" + atalhos para Contas e Categorias até a Etapa 6.
