# Product

<!-- impeccable:product-schema 1 -->

> Registro de produto lido pela skill Impeccable. A fonte de verdade continua sendo [docs/VISAO.md](docs/VISAO.md); se algo mudar lá, atualize aqui.

## Platform

web

## Users

Pessoas físicas no Brasil que querem controlar gastos, entender para onde vai o dinheiro e bater metas. Usam o celular como dispositivo principal (375 px) e pensam em reais (R$ 1.234,56), datas dd/MM/yyyy e português do Brasil.

Persona principal (**hipótese a validar** pela lista de espera e pelo Instagram @veloswallet): de 18 a 35 anos, renda fixa (CLT, estágio ou começo de carreira), salário que "some" antes do fim do mês. Hoje se organiza de cabeça, num caderno, numa planilha abandonada ou só olhando o app do banco. Dor: não sabe para onde o dinheiro vai e não tem reserva. Quer ver tudo num lugar só, sem complicação, e guardar para um objetivo.

## Product Purpose

Responder três perguntas: quanto eu tenho agora, para onde meu dinheiro está indo e se estou chegando perto do que quero. O MVP organiza o dinheiro em contas (corrente, poupança, dinheiro e cartão de crédito), registra receitas, despesas e transferências com categoria, mostra o mês (saldo total, receitas × despesas, gastos por categoria) e acompanha metas alimentadas por aportes manuais.

Sucesso depois do lançamento: 60% registram a 1ª transação em até 24 h do cadastro; 30% registram ao menos 1 transação por semana após 4 semanas; 90% das transações com categoria; 40% com ao menos 1 meta.

## Positioning

- Todas as contas num lugar só: os apps dos bancos só mostram o próprio banco.
- Sem loja de apps: instala direto do navegador (PWA), no celular e no PC.
- Privacidade como promessa: cada usuário só enxerga os próprios dados, garantido no servidor.
- Simples de verdade: concorrentes (Mobills, Organizze) cobram de R$ 19,90 a R$ 35 por mês por recursos que a maioria não usa; o Velos é gratuito durante o MVP.

## Operating Context

Uso rápido no celular: lançar uma despesa logo depois de gastar e consultar o mês no fim do mês ou antes de uma compra. Também abre no PC. O app é privado: toda tela interna exige login; a entrada é por email e senha ou conta Google.

## Capabilities and Constraints

- Etapas do MVP: autenticação, contas e categorias, transações, dashboard, metas e PWA instalável (ver docs/ROADMAP.md).
- Fora do MVP: recorrência, parcelamento, fatura de cartão, offline-first, app nativo, multimoeda e Open Finance.
- Stack: API ASP.NET Core + SPA React/Vite + Supabase (Postgres e Auth, em São Paulo). Dinheiro sempre em centavos inteiros; o sinal vem do tipo.
- Confirmação de email adiada até haver domínio próprio (spec 001, Revisão 1).

## Brand Commitments

- Nome **Velos Wallet**; frase *"Seu dinheiro na direção certa."*
- Logo em `web/public/brand/velos-claro.png` e `velos-escuro.png` (originais na raiz: `velos-perfil-*.png`).
- Regras de identidade obrigatórias (CLAUDE.md): o verde profundo é a marca e o verde vivo é dinheiro; o verde vivo nunca é botão principal no tema claro; cor de dinheiro só pelos tokens de receita e despesa; nunca depender só da cor (sempre sinal `+`/`-` e/ou ícone); tema claro e escuro.
- Voz nas telas: **próxima e direta** ("você", frases curtas, sem jargão de banco nem gíria). Emails transacionais em tom formal.

## Evidence on Hand

- Dados de mercado com fonte em docs/VISAO.md (CNC/Peic, Anbima/Datafolha, Lina Open X/MindMiners, Creditas/Opinion Box, 2026).
- Logos em PNG (claro e escuro).
- **Não existem:** usuários, depoimentos, clientes, imprensa, avaliações ou números de uso. Nunca inventar.

## Product Principles

1. Dinheiro exato: nenhum centavo some por arredondamento.
2. Nunca depender só da cor.
3. Privado por padrão, garantido no servidor.
4. Registro em segundos: lançar uma despesa em no máximo 3 toques.
5. Simples antes de completo: uma funcionalidade a menos é melhor que uma confusa.

## Accessibility & Inclusion

WCAG 2.1 AA: todo par texto/fundo com contraste de pelo menos 4,5:1 nos dois temas; funciona em 375 px sem rolagem horizontal; foco visível no teclado; todo campo com rótulo; erros anunciados para leitor de tela; alvos de toque de 44 px.
