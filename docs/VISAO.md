# Visão do produto

> **Velos Wallet** — *"Seu dinheiro na direção certa."*
> Leia este arquivo quando precisar decidir **se** algo deve ser feito. Para **como**, veja [ARQUITETURA.md](ARQUITETURA.md).

## Problema

Pessoas físicas no Brasil têm dificuldade de responder três perguntas simples sobre o próprio dinheiro:

1. **Quanto eu tenho agora?** O saldo está espalhado entre conta corrente, poupança, dinheiro vivo e cartão de crédito.
2. **Para onde o meu dinheiro está indo?** Sem categorizar os gastos, o fim do mês chega sem explicação.
3. **Estou chegando perto do que quero?** Metas (viagem, reserva de emergência, compra grande) ficam na cabeça e não num número.

## Público

Pessoas físicas no Brasil que querem controlar gastos, entender para onde vai o dinheiro e bater metas.

- Usam o celular como dispositivo principal, por isso tudo tem de funcionar bem em **375 px de largura**.
- Pensam em **reais** (R$ 1.234,56), em datas `dd/MM/yyyy` e em português do Brasil.
- **A DEFINIR:** persona principal (faixa etária, renda, se já usa outra ferramenta ou planilha).

## Proposta de valor

Um dashboard simples e visual que mostra saldo, receitas × despesas do mês, gastos por categoria e progresso das metas. Tudo **instalável** no celular e no PC (PWA), sem depender de loja de apps.

## Objetivos do MVP

| # | Objetivo | Como o usuário percebe |
|---|---|---|
| 1 | Cadastro e login seguros | Email/senha com confirmação ou conta Google |
| 2 | Organizar o dinheiro em contas | Corrente, poupança, dinheiro e cartão de crédito |
| 3 | Registrar movimentações | Receitas, despesas e transferências entre contas, com categoria |
| 4 | Entender o mês | Saldo total, receitas × despesas e gráfico por categoria |
| 5 | Acompanhar metas | Meta com valor-alvo e prazo, alimentada por aportes manuais |
| 6 | Usar como app | PWA instalável no celular e no desktop |

## Princípios de produto

- **Dinheiro exato.** Nenhum centavo pode sumir por arredondamento, já que valores são guardados em centavos inteiros.
- **Nunca depender só da cor.** Receita e despesa sempre levam também o sinal (`+`/`-`) e/ou um ícone.
- **Acessível nos dois temas.** Todo par texto/fundo passa 4,5:1 (WCAG AA), no claro e no escuro.
- **Privado por padrão.** Cada usuário só enxerga os próprios dados, e isso é garantido pelo banco (RLS), não só pelo app.
- **Simples antes de completo.** No MVP, é melhor uma funcionalidade a menos do que uma confusa.

## Fora do escopo do MVP

Não reintroduzir no meio de outra etapa:

- Transações recorrentes
- Compras parceladas
- Fatura de cartão de crédito (o cartão é uma conta normal, sem fechamento/vencimento)
- PWA offline-first (o PWA do MVP é apenas instalável)
- App nativo (só depois do MVP validado)
- Multimoeda (o campo `currency` existe em `profiles`, mas o app trata tudo como BRL)

## Métricas de sucesso

**A DEFINIR.** Sugestões para discutir:

- Usuários que registram pelo menos 1 transação por semana após o cadastro
- Percentual de transações com categoria
- Metas criadas e metas concluídas

## Modelo de negócio

**A DEFINIR** (gratuito, freemium, uso pessoal/portfólio?).
