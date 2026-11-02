# Spec 008 — Refinamentos de domínio (estudo do Organizze)

> **O QUE** fazer e **como saber que está pronto.** Detalhe técnico vai no `plan.md` (depois da aprovação).

- **Etapa do roadmap:** complemento das Etapas 5 (Transações) e 6 (Dashboard)
- **Status:** Rascunho
- **Data:** 2026-10-18
- **Origem:** engenharia reversa do Organizze (dossiê em `OneDrive\Área de Trabalho\REA-Research\organizze\`, ver `BRIEFING-VELOS.md` e `velos-wallet-opportunities.md`)

## Problema

As specs 004 e 005 entregaram o básico: lançar, listar e ver o resumo. O estudo do Organizze (16 anos de app de finanças no Brasil) mostrou o que falta não é fundamento (contraste, sinal `+`/`−`, estados de lista e mobile-first já são melhores no Velos), e sim **maturidade de domínio**:

1. Lançar várias transações seguidas custa uma ida e volta por transação.
2. A lista do mês mostra Receitas e Despesas, mas **não fecha com o saldo**: a pessoa não sabe com quanto começou nem com quanto terminou o mês nas contas.
3. Não há como repetir uma transação (aluguel, assinatura) sem digitar tudo de novo, e a recorrência está fora do MVP.
4. O filtro de categoria ativo só aparece dentro do `<select>`; o Organizze precisou de um artigo de ajuda só para "limpar filtros".
5. O Início exige escolher o tipo dentro do formulário, e mostra os valores sempre, mesmo usando o app em público, apesar da faixa "Privado por padrão" da página inicial.

Objetivo da [VISAO](../../VISAO.md): registrar rápido e entender para onde o dinheiro foi.

## Histórias de usuário

- Como **usuário**, quero lançar as despesas do fim de semana sem sair do formulário, para não perder tempo.
- Como **usuário**, quero copiar uma transação, para repetir o aluguel sem digitar tudo.
- Como **usuário**, quero ver quanto entrou e saiu em cada dia, para entender os dias caros.
- Como **usuário**, quero ver com quanto o mês começou e terminou nas minhas contas, para conferir com o banco.
- Como **usuário**, quero escolher Despesa, Receita ou Transferência já no Início, para lançar com um toque a menos.
- Como **usuário**, quero esconder os valores com um toque, para abrir o app em público.

## Escopo

### Dentro
- **A. Salvar e adicionar outra** no formulário de **nova** transação.
- **B. Copiar** uma transação a partir da tela de edição.
- **C. Resultado do dia** no rodapé de cada grupo de dia da lista; "Hoje" e "Ontem" com destaque visual.
- **D. Chip do filtro ativo** com `×` para limpar, na tela de Transações.
- **E. Movimento das contas no mês** (o "extrato"): saldo no início, entradas, saídas e saldo no fim, nas contas que formam o Saldo total.
- **F. Ações rápidas tipadas** no Início: Despesa · Receita · Transferência.
- **G. Esconder valores** (ícone de olho) no Início.

### Fora (explicitamente)
- Recorrência, parcelamento e fatura de cartão (fora do MVP pelo `CLAUDE.md`). **Copiar** é o substituto barato.
- **Realizado × previsto** (`paid` independente da data). É a maior oportunidade do estudo e o maior risco; contraria a RN4 da spec 004. Fica para um ADR próprio **depois do MVP**.
- Trocar a categoria direto na lista (botão dentro de link: risco de acessibilidade), detalhe em *bottom sheet*, cartões recolhíveis no Início.
- Exportar dados (é a prova barata da promessa de privacidade, e o Organizze mantém a exportação até com o plano vencido). Registrar como pós-MVP.
- Arquivar contas (contraria o [ADR 0017](../../adr/0017-excluir-conta-apaga-movimentacoes.md)).

### Já atendido (não mexer)
- Sinal `+`/`−` em receita e despesa (o Organizze mostra receita só pela cor).
- Saldo total em cor neutra (cartão `primary`), sem tom de receita ou despesa.
- Estados de carregando, vazio e erro; alvos de 44 px; 375 px.

## Regras de negócio

- **RN1 — Um saldo só.** "Saldo" sem complemento é sempre o **Saldo total** do Início (contas sem o cartão, [ADR 0007](../../adr/0007-transferencia-registro-unico-e-cartao.md)). Qualquer outro número tem nome próprio: "Resultado do dia", "Saldo em 1º de outubro", "Saldo em 31 de outubro". Regra também registrada no `DESIGN.md`.
- **RN2 — Salvar e adicionar outra** mantém tipo, conta (ou De/Para), categoria e data; limpa valor e descrição; devolve o foco ao valor; anuncia "Transação salva" por `aria-live`. Não existe na edição.
- **RN3 — Copiar** abre o formulário de **nova** transação com tipo, valor, conta(s), categoria e descrição da original, e a **data de hoje**. Nada é gravado até "Salvar". O título deixa claro que é uma transação nova.
- **RN4 — Resultado do dia** = receitas − despesas do dia entre as transações **mostradas** (com filtro de categoria, só as filtradas). Transferências não entram. Leva sinal e cor de dinheiro.
- **RN5 — Movimento das contas no mês** considera só as contas do Saldo total (corrente, poupança e dinheiro):
  - **Saldo em 1º do mês** = saldo dessas contas no fim do mês anterior.
  - **Entrou nas contas** = receitas nessas contas + transferências vindas de cartão.
  - **Saiu das contas** = despesas nessas contas.
  - **Pago ao cartão** = transferências dessas contas para cartões.
  - Transferências entre duas dessas contas se anulam e não aparecem.
  - **Saldo em [último dia]** (ou **"hoje"** no mês atual) = Saldo em 1º + entrou − saiu − pago ao cartão.
  - **Despesas no cartão não entram** (não tiram dinheiro da conta agora); aparecem numa nota: "Gastos no cartão no mês: R$ X (entram quando você paga o cartão)".
  - No mês atual, o saldo final é **igual ao Saldo total do Início, ao centavo**.
  - Some no SQL, como todo total do projeto.
- **RN6 — Nomes diferentes de propósito.** O bloco do mês já existente ("Receitas"/"Despesas", que incluem o cartão) não muda. O novo bloco usa os verbos "Entrou"/"Saiu" para nunca existirem dois "Despesas" com valores diferentes na mesma tela.
- **RN7 — Ações rápidas** abrem o formulário com o tipo já escolhido; o resto do comportamento (última conta e categoria) é o da spec 004.
- **RN8 — Esconder valores** troca cada valor por `••••` (o valor sai também do leitor de tela), vale até a pessoa mostrar de novo, e fica guardado **só neste navegador**. O botão diz o estado ("Esconder valores" / "Mostrar valores", `aria-pressed`).

## Telas e estados

| Tela | Rota | Mudança | Estados |
|---|---|---|---|
| Nova transação | `/transacoes/nova?tipo=…` | Botão secundário "Salvar e adicionar outra"; `?tipo=` pré-seleciona a aba; aceita valores de cópia | Salvando (os dois botões desabilitados), erro do servidor |
| Editar transação | `/transacoes/:id` | Ação "Copiar" | — |
| Transações | `/transacoes?mes=&categoria=` | Chip do filtro com `×`; rodapé "Resultado do dia"; destaque de Hoje/Ontem; bloco "Movimento das contas" | Skeleton do bloco novo; mês vazio mostra saldo inicial = final |
| Início | `/painel` | Linha de 3 ações tipadas no lugar de "Lançar"; olho ao lado do Saldo total | Valores escondidos persistem ao recarregar |

Tudo em 375 px e 1440 px, temas claro e escuro, textos em português do Brasil.

## Critérios de aceite

- [ ] **CA1** — Na nova transação, lançar 5 despesas seguidas com "Salvar e adicionar outra": as 5 aparecem na lista, com conta, categoria e data mantidas, e o foco volta ao valor depois de cada uma.
- [ ] **CA2** — Copiar uma transação de 10/out abre o formulário de nova com os mesmos dados e a data de hoje; salvar cria um registro novo e a original não muda.
- [ ] **CA3** — Em outubro, a soma dos "Resultado do dia" é igual ao "Resultado do mês" (sem filtro e com filtro de categoria).
- [ ] **CA4** — Com dados conhecidos (inclusive uma despesa no cartão, um pagamento de cartão e uma transferência entre contas), "Saldo em 1º" + entrou − saiu − pago ao cartão = saldo final, ao centavo, em três meses seguidos, incluindo um mês sem transações.
- [ ] **CA5** — No mês atual, o saldo final do bloco "Movimento das contas" é igual ao Saldo total do Início.
- [ ] **CA6** — Com filtro de categoria ativo, aparece um chip com o nome da categoria; tocar no `×` volta para "Todas" e o endereço perde `categoria=`.
- [ ] **CA7** — No Início, "Despesa" abre o formulário já em Despesa: de 4 para 3 toques até gravar uma despesa.
- [ ] **CA8** — Esconder valores, recarregar: continuam escondidos; o leitor de tela anuncia o estado do botão e não lê os valores.
- [ ] **CA-seg** — O bloco novo de saldos só soma dados do usuário logado (RLS e filtro na `Application`); outro usuário não consegue ler os números por `?mes=`.
- [ ] **CA-a11y** — 375 px, dois temas; resultado do dia e linhas do movimento com sinal **e** cor; chip e olho com 44 px e nome acessível.
- [ ] **CA-build** — `dotnet build api`, `dotnet test api`, `typecheck`, `lint` e `build` do `web` passam.

## Perguntas em aberto

- [ ] **P1** — Esconder valores só no Início (proposta) ou no app todo (Transações e Contas também)? No app todo exige um contexto compartilhado e toca mais telas.
- [ ] **P2** — Ações tipadas também no desktop (hoje o botão "Lançar" some em `lg`, porque o menu lateral tem "Nova transação")? Proposta: sim, a linha substitui o botão nos dois tamanhos.
- [ ] **P3** — O rodapé do dia ganha um `+` para lançar naquela data (como no Organizze)? Proposta: não agora; menos ruído na lista.
- [ ] **P4** — O bloco "Movimento das contas" aparece com filtro de categoria? Proposta: **não**: com filtro ele não fecha, então some e fica só o resultado do filtro.
- [ ] **P5** — Ordem de entrega: A–D só no front (rápidas), E exige view nova + API, F–G só no front. Proposta: E por último, numa migration própria.
