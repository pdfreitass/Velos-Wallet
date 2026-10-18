# Spec 006 — Metas

> **O QUE** fazer e **como saber que está pronto.** Nada de detalhe técnico aqui: isso vai no [plan.md](plan.md).

- **Etapa do roadmap:** Etapa 7 — Metas
- **Status:** Aprovada (2026-10-18: o Pedro confirmou P1–P4 conforme a recomendação)
- **Data:** 2026-10-18

## Problema

O objetivo 3 da [VISAO](../../VISAO.md) é **"Estou chegando perto do que quero?"**: metas como viagem, reserva de emergência ou compra grande ficam na cabeça, e não num número. "Guardar dinheiro" é a meta mais citada para 2026 (56%). A pessoa precisa dar um nome e um valor à meta, registrar o que guardou e ver, num relance, **quanto falta** e se o prazo é realista.

## Histórias de usuário

- Como **usuário**, quero criar uma meta com nome, valor-alvo e prazo opcional, para transformar um desejo num número.
- Como **usuário**, quero registrar um aporte (quanto guardei e quando), para ver a meta andar.
- Como **usuário**, quero ver quanto já juntei, quanto falta e quanto preciso guardar por mês até o prazo, para saber se estou no ritmo.
- Como **usuário**, quero ver as minhas metas no Início, para lembrar delas sem abrir outra tela.
- Como **usuário**, quero corrigir ou apagar um aporte ou uma meta, para consertar um erro de digitação.

## Escopo

### Dentro
- **Tela Metas (`/metas`):** lista de metas com a barra de progresso, `X de Y`, o texto de estado e o prazo.
- **Criar, editar e excluir meta** (nome, valor-alvo, prazo opcional).
- **Detalhe da meta (`/metas/:id`):** progresso, ritmo necessário até o prazo e a lista de aportes, do mais recente para o mais antigo.
- **Aporte:** registrar (valor e data), editar e excluir.
- **Bloco "Metas" no Início:** até 3 metas em andamento, com o mesmo componente de progresso e o link "Ver todas".
- **Item "Metas" na navegação** (celular e desktop).
- **Estados:** carregando (skeleton), vazio, erro e meta não encontrada.
- **Pendência técnica T1 do ROADMAP:** `goal_contributions` ganha `updated_at` e o trigger `set_updated_at`.

### Fora (explicitamente)
- **Aporte ligado a uma conta** (tirar o dinheiro do saldo, ou transferir para a poupança): o aporte é manual e não mexe em nenhum saldo (VISAO: "aportes manuais").
- **Resgate / retirada** (aporte negativo). Para corrigir, edita-se ou exclui-se o aporte (ver P2).
- Aporte recorrente/automático, meta compartilhada, ícone ou cor por meta, arquivar meta, notificações de prazo.
- Limite/teto de gastos por categoria (o "limitar" do DESIGN.md é outro domínio).

## Regras de negócio

- **RN1 — Meta:** nome obrigatório (1 a 60 caracteres, sem espaços nas pontas), valor-alvo inteiro em centavos, **> 0** e até o mesmo teto das transações; prazo opcional. Nomes repetidos são permitidos.
- **RN2 — Prazo:** ao **criar**, o prazo não pode estar no passado (hoje de São Paulo é aceito). Ao **editar**, um prazo que já passou pode ser mantido, mas não pode ser trocado por outra data no passado.
- **RN3 — Aporte:** valor inteiro em centavos, **> 0**, com o mesmo teto das transações; data obrigatória, entre 01/01/2000 e hoje (não aceita data futura). O aporte **não altera** nenhum saldo de conta nem o resumo do mês.
- **RN4 — Progresso:** "juntado" é a soma dos aportes da meta, **somada no banco** (ADR 0006). "Falta" = alvo − juntado, nunca abaixo de zero.
- **RN5 — Estado da meta** (texto sempre visível, nunca só a cor; cores do DESIGN.md → "Barras de progresso", domínio **atingir**):
  - sem aportes → "Comece com o primeiro aporte" (barra `muted`);
  - em andamento → "Faltam R$ X" (barra `primary`);
  - juntado ≥ alvo → "Meta atingida" (barra `income`, cheia). Continua aceitando aportes; o excedente aparece como "R$ X além da meta".
- **RN6 — Ritmo:** com prazo e meta não atingida, mostra **"Guarde R$ X por mês até <mês/ano>"** = falta ÷ meses restantes (contando o mês atual; arredondado **para cima**, em centavos). Prazo vencido e meta não atingida → "Prazo encerrado em <data>", sem ritmo. Sem prazo → sem ritmo.
- **RN7 — Excluir meta** apaga os aportes dela (já é `on delete cascade`), com confirmação que diz quantos aportes e quanto somam.
- **RN8 — Ordem da lista:** em andamento primeiro (prazo mais próximo primeiro; sem prazo por último), depois as atingidas.
- **RN9 — Início:** mostra até 3 metas **em andamento**, na ordem da RN8. Sem metas → convite "Crie sua primeira meta"; só atingidas → bloco com "Todas as suas metas foram atingidas" e o link.

## Telas e estados

| Tela | Rota | Estados obrigatórios | Observações |
|---|---|---|---|
| Metas | `/metas` | skeleton · vazio · erro · sucesso | Cartão por meta: nome, barra (`aria-hidden`), `X de Y`, texto de estado, prazo. Botão "Nova meta" |
| Nova / editar meta | `/metas/nova`, `/metas/:id/editar` | erro de validação · enviando | Nome, valor-alvo (`MoneyInput`), prazo opcional |
| Detalhe da meta | `/metas/:id` | skeleton · erro · não encontrada · sem aportes · sucesso | Progresso grande, ritmo, "Novo aporte", lista de aportes com editar/excluir, editar/excluir meta |
| Aporte | diálogo no detalhe | erro de validação · enviando | Valor e data (padrão: hoje) |
| Bloco no Início | `/painel` | skeleton · vazio · erro (só do bloco) · sucesso | Até 3 metas + "Ver todas" |

Todas em **375 px** e **1440 px**, temas **claro e escuro**. Textos em **português do Brasil**, com acento.

## Critérios de aceite

- [ ] **CA1** — Crio "Viagem para o Chile" com alvo de R$ 8.000,00 e prazo em junho de 2027; ela aparece em `/metas` com "R$ 0,00 de R$ 8.000,00" e "Comece com o primeiro aporte".
- [ ] **CA2** — Com aportes de R$ 500,00 e R$ 1.500,00, a meta mostra "R$ 2.000,00 de R$ 8.000,00" e "Faltam R$ 6.000,00"; em outubro de 2026, o ritmo é "Guarde R$ 666,67 por mês até junho de 2027" (9 meses, arredondado para cima).
- [ ] **CA3** — Um aporte que passa do alvo mostra "Meta atingida", a barra cheia em verde **e** o texto "R$ X além da meta".
- [ ] **CA4** — Editar ou excluir um aporte atualiza o progresso na hora (lista, detalhe e Início).
- [ ] **CA5** — Excluir a meta pede confirmação com o número de aportes e o total, e some de `/metas` e do Início.
- [ ] **CA6** — Validação: alvo ou aporte zerado, nome vazio, prazo no passado ao criar e aporte com data futura são recusados **pela API** (e avisados no formulário).
- [ ] **CA7** — Registrar um aporte não muda o saldo total, as contas nem o mês no Início.
- [ ] **CA8** — O Início mostra até 3 metas em andamento na ordem da RN8, o convite quando não há metas e o link "Ver todas".
- [ ] **CA9** — `goal_contributions` passa a ter `updated_at`, atualizado pelo trigger ao editar um aporte.
- [ ] **CA-seg** — Outro usuário não lê, não edita, não aporta e não exclui a minha meta nem os meus aportes, nem por id direto (RLS + filtro por `user_id`, 404 em vez de 403); revisão do agente `security` sem críticos ou altos.
- [ ] **CA-a11y** — 375 px, dois temas; a barra é `aria-hidden` e o progresso está em texto; nada depende só da cor; contraste ≥ 4,5:1.
- [ ] **CA-build** — `dotnet build api`, `dotnet test api`, `typecheck`, `lint` e `build` do `web` passam.

## Perguntas em aberto

- [x] **P1 — Navegação no celular:** a barra inferior já tem 5 espaços (Início, Transações, **+**, Contas, Categorias). Recomendação: **Metas entra no lugar de Categorias** na barra; Categorias continua no menu lateral do desktop e ganha um link na tela de Contas ("Gerenciar categorias") e no filtro de Transações. Alternativa: 6 itens (fica apertado em 375 px com "Transações").
- [x] **P2 — Resgate:** permitir retirar dinheiro da meta (aporte negativo)? Recomendação: **não no MVP**; corrigir é editar/excluir o aporte. Entra numa spec própria, se houver pedido.
- [x] **P3 — Ritmo mensal (RN6):** mostrar "Guarde R$ X por mês"? Recomendação: **sim**, é o que responde "estou no ritmo?" com uma conta só: o "falta" vem somado do banco e a divisão pelos meses usa o "hoje" de São Paulo.
- [x] **P4 — Meta no Início:** até 3 em andamento (RN9)? Recomendação: **sim**; a VISAO põe "progresso das metas" no dashboard.
