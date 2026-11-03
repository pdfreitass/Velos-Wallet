# Spec 012 — "E se você não tivesse gastado?"

> **O QUE** fazer e **como saber que está pronto.** O detalhe técnico está no [plan.md](plan.md).

- **Etapa do roadmap:** Etapa 9 — primeira ideia do caderno ([I5](../../IDEIAS.md#i5--e-se-você-não-tivesse-gastado))
- **Status:** Concluída
- **Data:** 2026-11-03

## Problema

O app já mostra **para onde o dinheiro foi** (Início, rosca de categorias) e **para onde ele vai** (Metas). Falta a ponte entre os dois: o usuário vê que gastou R$ 420 em Lazer e não tem nenhuma ferramenta que responda *"e se eu cortasse um pedaço disso?"*.

Hoje essa conta é feita de cabeça, ou não é feita. E quando é feita, perde-se: não vira meta, não vira nada.

Liga ao objetivo da [VISAO](../../VISAO.md) de o app não só registrar, mas ajudar a decidir.

## Histórias de usuário

- Como **usuário**, quero simular um corte numa categoria que eu escolho, para ver quanto sobraria por mês.
- Como **usuário**, quero ver a projeção em 6 e 12 meses, para entender o peso da decisão no tempo.
- Como **usuário**, quero transformar a simulação numa meta com um toque, para a intenção virar compromisso.
- Como **usuário novo**, quero que o app me diga que ainda não tem dados suficientes, em vez de me mostrar um número inventado.

## Escopo

### Dentro
- Tela de simulação em `/simular`, alcançável a partir do bloco de gastos por categoria no Início.
- Escolha da **categoria** entre as que tiveram despesa no período considerado.
- Corte em **10%, 20%, 30%** ou **percentual livre** (1 a 100), com o resultado mudando na hora.
- Resultado: economia **por mês**, em **6 meses** e em **12 meses**.
- Botão **"Transformar em meta"**, que abre o formulário de meta já preenchido.
- Estado explícito de **dados insuficientes**.

### Fora (explicitamente)
- **Classificar despesa como supérflua ou essencial.** O app não tem esse conceito e não vai adivinhar: quem escolhe a categoria é a pessoa (ver RN2).
- **Orçamentos** por categoria (é o X1 da auditoria, outra feature).
- Simular corte em **várias categorias ao mesmo tempo**.
- Simular aumento de receita, investimento ou rendimento.
- Guardar a simulação. Ela é efêmera; o que persiste é a meta criada a partir dela.
- Qualquer uso de **IA** — a conta é aritmética e determinística.
- Notificações ou lembretes sobre o corte simulado.

## Regras de negócio

- **RN1 — A base é a média mensal, não o mês corrente.** A simulação parte da **média de gasto da categoria nos últimos 3 meses completos**. O mês corrente fica **fora**: ele está incompleto e puxaria a média para baixo todo dia 1.
- **RN2 — Quem escolhe a categoria é o usuário.** O app nunca marca uma categoria como cortável. Ele ordena por valor, porque é útil, mas "Moradia" e "Lazer" aparecem com o mesmo tratamento.
- **RN3 — Projeção não é promessa.** Todo valor projetado é escrito com o "se" visível: *"se você mantivesse esse corte por 12 meses"*. Em nenhum lugar aparece "você vai economizar".
- **RN4 — Sem mês completo, não há simulação.** Com **zero** meses completos com despesa na categoria, a tela mostra o estado de dados insuficientes e não oferece número nenhum.
- **RN5 — Pouco dado é dito, não escondido.** Com 1 ou 2 meses completos, a simulação acontece, mas a tela diz em quantos meses a média se apoia.
- **RN6 — O dinheiro é inteiro, em centavos.** O corte é calculado em centavos e arredondado para o centavo mais próximo **uma única vez**, na conta mensal. As projeções de 6 e 12 meses são múltiplos do valor mensal já arredondado, para que 6× o que está na tela seja exatamente o que a tela mostra.
- **RN7 — Corte de 100% é permitido.** "E se eu não gastasse nada nisso?" é a pergunta original da ideia, e é legítima. Corte de 0% não é: o mínimo é 1%.
- **RN8 — A meta criada é uma sugestão, não um compromisso automático.** O botão leva ao formulário de meta preenchido (nome e valor), e **nada é salvo** até o usuário confirmar ali. O prazo sugerido é de 12 meses, editável.
- **RN9 — "Sem categoria" entra na simulação.** Transações sem categoria são um gasto real e podem ser simuladas, com o mesmo rótulo que o Início já usa.
- **RN10 — Transferências e receitas ficam fora.** Só despesa, como na `category_spending` de hoje.

## Telas e estados

| Tela | Rota | Estados obrigatórios | Observações |
|---|---|---|---|
| Simulação | `/simular` | loading (skeleton) · **dados insuficientes** · erro · sucesso | Entrada pelo bloco "Gastos por categoria" do Início. Aceita `?categoria=<id>` para já abrir na categoria escolhida |
| Início | `/painel` | — | Ganha um link para a simulação no bloco de categorias. Nada mais muda |
| Nova meta | `/metas/nova` | — | Passa a aceitar `?nome=` e `?valor=` para vir preenchida. Sem os parâmetros, comporta‑se como hoje |

Em **375 px**: a categoria escolhida e o percentual ficam no topo, o resultado logo abaixo, sem rolagem para ver o número principal. Nos dois temas. O valor economizado usa `text-income`, nunca `text-emerald-*` solto, e vem sempre acompanhado do sinal, nunca só da cor.

Textos em **português do Brasil**, com acento.

## Critérios de aceite

Conferidos em **2026-11-03**. A coluna diz **como** cada um foi verificado — "navegador" é o app
rodando em 375 px, com dados semeados nos três cenários numa conta de teste, depois apagada.

- [x] **CA1** — Dado um usuário com 3 meses completos de despesa em "Lazer" (R$ 300, R$ 400 e R$ 500), quando abre `/simular`, escolhe "Lazer" e corta 20%, então vê **R$ 80,00 por mês** (20% de R$ 400 de média). · *navegador + teste*
- [x] **CA2** — Dado o cenário do CA1, então os valores de 6 e 12 meses são **R$ 480,00** e **R$ 960,00** — exatamente 6× e 12× o valor mensal mostrado (RN6). · *navegador + teste*
- [x] **CA3** — Dado um usuário **sem nenhum mês completo** com despesa, quando abre `/simular`, então vê o estado de dados insuficientes, com explicação, e **nenhum valor simulado**. · *navegador + teste*
- [x] **CA4** — Dado um usuário com **apenas 1 mês completo**, quando simula, então o resultado aparece **e** a tela diz que a média se apoia em 1 mês. · *teste de integração; no navegador foi visto com 2 meses*
- [x] **CA5** — Dado o mês corrente com despesas, quando a média é calculada, então essas despesas **não entram** (RN1). · *navegador (R$ 400 e não R$ 549,75) + teste*
- [x] **CA6** — Quando o usuário move o percentual, então o resultado muda **sem recarregar a página** e sem nova chamada à API. · *navegador, confirmado na aba de rede*
- [x] **CA7** — Quando o usuário toca em "Transformar em meta", então vai para `/metas/nova` com nome e valor preenchidos, e **nenhuma meta foi criada** até ele confirmar (RN8). · *navegador + contagem no banco*
- [x] **CA8** — Um corte de 100% é aceito; um de 0% não, com mensagem em português. · *testes dos dois lados; na tela o `input[type=range]` não deixa chegar a 0*
- [x] **CA9** — A categoria "Sem categoria" pode ser simulada (RN9). · *navegador + teste* — conferido em 2026-11-03 com 3 meses de despesa numa categoria apagada depois dos lançamentos, em 375 px e nos dois temas: a tela mostra o rótulo com o círculo "?" e simula (média de R$ 400,00 → 20% = +R$ 80,00/mês)
- [x] **CA-seg** — Um usuário não consegue simular sobre dados de outro: a média vem de view com `security_invoker` e a query filtra pelo usuário autenticado (RLS). · *teste de integração com dois usuários reais*
- [x] **CA-a11y** — Funciona em 375 px, nos dois temas, nenhuma informação depende só da cor, e o resultado é anunciado a leitor de tela quando muda. · *375 px e os dois temas vistos; o `aria-live` está no código mas **não foi ouvido num leitor de tela***
- [x] **CA-build** — `dotnet build api`, `dotnet test api`, `npm run typecheck`, `npm run lint` e `npm run build` passam. · *386 testes na API, 58 no front, 0 falhas*

## Perguntas em aberto

- [ ] **3 meses é a janela certa?** Escolhido por ser curto o bastante para refletir o hábito atual e longo o bastante para diluir um mês atípico. Rever depois de o Pedro ter uso real — é exatamente o tipo de número que só se calibra com dado.
- [ ] **O link no Início é suficiente?** A simulação não tem lugar na navegação inferior (que tem 4 itens + o botão central, e está cheia). Se a feature pegar, isso volta à mesa.
