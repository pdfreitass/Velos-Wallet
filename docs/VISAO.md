# Visão do produto

> **Velos Wallet** — *"Seu dinheiro na direção certa."*
> Leia este arquivo quando precisar decidir **se** algo deve ser feito. Para **como**, veja [ARQUITETURA.md](ARQUITETURA.md).

## Problema

Pessoas físicas no Brasil têm dificuldade de responder três perguntas simples sobre o próprio dinheiro:

1. **Quanto eu tenho agora?** O saldo está espalhado entre conta corrente, poupança, dinheiro vivo e cartão de crédito.
2. **Para onde o meu dinheiro está indo?** Sem categorizar os gastos, o fim do mês chega sem explicação.
3. **Estou chegando perto do que quero?** Metas (viagem, reserva de emergência, compra grande) ficam na cabeça e não num número.

## Por que agora

- **82%** das famílias brasileiras estão endividadas, recorde da série (CNC/Peic, jul/2026).
- **31%** dos brasileiros não têm nenhuma reserva de emergência e outros **32%** têm menos que o mínimo (Anbima/Datafolha, Raio X do Investidor 2026).
- **48%** controlam o dinheiro com anotação manual ou planilha e **16%** não controlam nada (Lina Open X/MindMiners, 2026).
- "Guardar dinheiro" (56%) e "organizar as finanças" (54%) são as metas mais citadas para 2026 (Creditas/Opinion Box, 2026).

## Público

Pessoas físicas no Brasil que querem controlar gastos, entender para onde vai o dinheiro e bater metas.

- Usam o celular como dispositivo principal, por isso tudo tem de funcionar bem em **375 px de largura**.
- Pensam em **reais** (R$ 1.234,56), em datas `dd/MM/yyyy` e em português do Brasil.

### Persona principal (hipótese a validar)

- **Quem:** de 18 a 35 anos, com renda fixa (CLT, estágio ou começo de carreira) e salário que "some" antes do fim do mês.
- **Como se organiza hoje:** de cabeça, num caderno, numa planilha abandonada ou só olhando o app do banco.
- **Dor principal:** não sabe para onde o dinheiro vai e não tem reserva.
- **O que quer:** ver tudo num lugar só, sem complicação, e conseguir guardar para um objetivo.
- **Como validar:** perguntas na lista de espera e enquetes no Instagram (@veloswallet).

## Proposta de valor

Um dashboard simples e visual que mostra saldo, receitas × despesas do mês, gastos por categoria e progresso das metas. Tudo **instalável** no celular e no PC (PWA), sem depender de loja de apps.

### Diferenciais

- **Todas as contas num lugar só.** Os apps dos bancos só mostram o próprio banco.
- **Sem loja de apps.** Instala direto do navegador, no celular e no PC.
- **Privacidade como promessa.** Golpes e fraudes são a maior preocupação financeira de 56% dos brasileiros.
- **Simples de verdade.** Concorrentes como Mobills e Organizze cobram de R$ 19,90 a R$ 35 por mês por recursos que a maioria não usa.

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
- **Privado por padrão.** Cada usuário só enxerga os próprios dados, e isso é garantido no servidor (a API filtra todo acesso pelo usuário autenticado), não só na interface.
- **Registro em segundos.** Lançar uma despesa leva no máximo 3 toques. Se registrar for chato, a pessoa desiste do hábito.
- **Simples antes de completo.** No MVP, é melhor uma funcionalidade a menos do que uma confusa.

## Fora do escopo do MVP

Não reintroduzir no meio de outra etapa:

- Transações recorrentes
- Compras parceladas
- Fatura de cartão de crédito (o cartão é uma conta normal, sem fechamento/vencimento)
- PWA offline-first (o PWA do MVP é apenas instalável)
- App nativo (só depois do MVP validado)
- Multimoeda (o campo `currency` existe em `profiles`, mas o app trata tudo como BRL)
- Integração bancária automática / Open Finance

## Métricas de sucesso

### Antes do lançamento (validação de interesse)

| Métrica | Meta em 90 dias |
|---|---|
| Inscritos na lista de espera | 200 |
| Seguidores no Instagram | 500 |
| Visitas ao site por semana | 100 |

### Depois do lançamento (uso do produto)

| Métrica | Como medir | Meta inicial |
|---|---|---|
| Ativação | Usuários que registram a 1ª transação em até 24 h do cadastro | 60% |
| Hábito | Usuários que registram pelo menos 1 transação por semana, 4 semanas após o cadastro | 30% |
| Categorização | Transações com categoria | 90% |
| Metas | Usuários com pelo menos 1 meta criada | 40% |

As metas são pontos de partida. Revise após o primeiro mês com dados reais.

## Modelo de negócio

**Decisão atual:** gratuito durante o MVP e a validação. O foco agora é divulgar a marca e medir interesse.

**Como decidir o modelo definitivo:** quando a lista de espera passar de 200 pessoas, perguntar se pagariam por um plano (ex.: R$ 9,90/mês). Se poucos aceitarem, seguir gratuito para ganhar usuários e testar um plano pago depois. Se a adesão for boa, avaliar freemium: o essencial grátis e recursos avançados no plano pago.