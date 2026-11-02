# Changelog

> Histórico de entregas, do mais recente para o mais antigo.
> Formato inspirado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/). Ainda não há versões publicadas, por isso as entradas são agrupadas por data e etapa.
> Atualize **ao terminar cada feature**, junto com o [ROADMAP](ROADMAP.md).

## [Não lançado]

### 2026-11-01 — Etapa 7: metas (spec 006)
#### Adicionado
- Telas das metas: `/metas` (lista em andamento e atingidas, na ordem da RN8), `/metas/nova`, `/metas/:id` (progresso, ritmo e aportes) e `/metas/:id/editar`, todas em `lazy()`.
- Aportes: registrar, corrigir e excluir num diálogo, com hoje como data padrão. O aporte **não** altera nenhum saldo nem o resumo do mês (RN3), por isso as mutações invalidam só `["goals"]`.
- `GoalProgress`: barra do domínio **atingir** do DESIGN.md (`muted` em zero, `primary` em andamento, `income` ao atingir — a cor nunca vem da porcentagem), com `X de Y` e o texto de estado em texto; a barra é `aria-hidden`.
- Ritmo mensal da RN6 ("Guarde R$ X por mês até <mês/ano>") e "Prazo encerrado em <data>" quando o prazo passou.
- Bloco "Metas" no Início: até 3 metas em andamento, convite quando não há nenhuma e "Todas as suas metas foram atingidas" quando só restam atingidas. Usa a mesma query da lista, então aportar atualiza os dois.
- Excluir meta diz quantos aportes somem e quanto somam (RN7).
- `components/ui/dialog.tsx` sobre o `@base-ui/react` já instalado (sem dependência nova): o `alert-dialog` é para confirmação, e um formulário dentro dele daria `role="alertdialog"`.
- P1 da spec: **Metas entra no lugar de Categorias** na barra do celular; Contas ganha o atalho "Gerenciar categorias" e o desktop mantém os cinco itens no menu lateral.
#### Corrigido
- Revisão `qa`: a barra mostrava 100% com a meta ainda em andamento (R$ 7.990 de R$ 8.000 arredondava para 100) e 0% com um primeiro aporte pequeno — os extremos passam a vir do estado, não do arredondamento; "Prazo encerrado" deixou de usar `text-expense`, que é cor de dinheiro; alvo de 44 px no "Ver todas"; Esc e o clique no fundo não fecham mais o diálogo com o aporte sendo salvo; `max-h` no diálogo para 375×667 com o teclado aberto.
- 404 numa mutação (meta excluída em outra aba) recarrega a lista, em vez de deixar o cache antigo atrás do diálogo.
#### Segurança
- Revisão `security`: aprovada, sem achados críticos ou altos. O front só fala com a API, ids com `encodeURIComponent`, 404 igual para meta inexistente, de outra pessoa ou id inválido (CA-seg).

### 2026-11-01 — Contraste do botão de confirmar exclusão
#### Corrigido
- A variante `destructive` usava fundo tingido com o texto na mesma cor: 3,53:1 sobre o cartão do diálogo, abaixo dos 4,5:1 da regra. Passa a ser cor sólida com `--destructive-foreground` novo (5,69:1 no escuro, 4,95:1 no claro; 6,40 e 5,57 no hover). Vale para excluir conta, categoria, transação, meta e aporte.

### 2026-10-18 — Etapa 6: dashboard (spec 005)
#### Adicionado
- `GET /api/dashboard?month=yyyy-MM`: saldo total sem o cartão, dívida do cartão, receitas × despesas do mês e gastos por categoria, tudo somado no banco (ADR 0006).
- Migration `0012`: view `category_spending` (`security_invoker = on`), despesas por categoria e mês, com "Sem categoria" para a categoria excluída.
- Início vira o dashboard: cards de saldo e dívida, seletor de mês (`?mes=`), resultado do mês e barras de gastos por categoria em HTML/CSS, sem biblioteca de gráfico ([ADR 0018](adr/0018-grafico-de-categorias-sem-biblioteca.md)). Cada categoria leva à lista de transações já filtrada. Primeiros passos para quem ainda não tem conta.
- `MonthKey` compartilhado entre transações e dashboard (2000 a 2100, mês atual de São Paulo como padrão).
#### Corrigido
- Revisão `qa` (T4): o seletor de mês continua na tela quando um mês falha ao carregar; o título não mostra "Olá, " sem nome; categoria abaixo de 0,5% aparece como "<1%".
- Testes de integração rodam em sequência: todas as classes usam o mesmo usuário de teste, e em paralelo uma estragava o "antes/depois" da outra.
#### Segurança
- Revisão `security`: aprovada, sem achados críticos, altos ou médios. O `join` com `categories` também filtra por `user_id` (defesa além da RLS).

### 2026-10-17 — Etapa 5: transações (spec 004)
#### Adicionado
- API de transações (`/api/transactions`): criar, editar, excluir e listar o mês com totais da `monthly_summary`; conta, conta de destino e categoria conferidas como da própria pessoa (id alheio = 404).
- Regras no `Domain` com o "hoje" de São Paulo: valor > 0 até R$ 999.999.999,99, data entre 01/01/2000 e hoje, descrição até 100 caracteres (check no banco pela `0011`), tipo trocado só entre despesa e receita na edição.
- Telas: lista do mês com totais, filtro por categoria (`?categoria=`) e agrupamento por dia; formulário com lançamento em 3 toques, última conta e categoria usadas já sugeridas, edição e exclusão com confirmação curta.
- "Transações" na navegação e botão "Nova transação" na barra, no menu e no Início.
- Lista do mês limitada no servidor (`MaxMonthItems`) e categoria do filtro validada como UUID no front.

### 2026-10-17 — Etapa 4: contas e categorias (spec 002)
#### Adicionado
- API de contas e categorias (`/api/accounts`, `/api/categories`), com handlers na `Application` (FluentValidation), stores com RLS e filtro por `user_id`, e o impacto da exclusão (`deletion-impact`). Saldo atual somado no SQL (`account_balances`).
- Migrations `0009` e `0010`: cheque especial na conta corrente, limites de nome no banco, nome de categoria único por tipo sem diferenciar maiúsculas e `on delete set null (category_id)` nas transações.
- Navegação do app logado: barra inferior no celular e menu lateral de 240 px no desktop, item atual marcado além da cor, "Pular para o conteúdo"; Início com atalhos para Contas e Categorias.
- Telas de contas: lista com contas e cartões em seções ("Fatura atual"), formulário com o texto do valor por tipo e a opção de cheque especial, tipo travado na edição, exclusão com o detalhe da RN6 (receitas, despesas, transferências, contas afetadas) e o botão só ativo depois de "Entendi".
- Telas de categorias: abas Despesas e Receitas (aba no endereço), 12 cores e 30 ícones com pré-visualização, exclusão avisando quantas movimentações passam a "Sem categoria".
- Componentes reutilizáveis: `MoneyInput` (centavos, dígitos pela direita, teto de R$ 999.999.999,99), `CategoryBadge`, `LoadError`, `FormPageShell`; base shadcn `alert-dialog`, `checkbox`, `radio-group` e `skeleton`.
- Paleta das categorias com um tom por tema e o ícone ≥ 3:1 (contraste medido em `globals.css`); o banco guarda o hex canônico.
- "Conta/Categoria não encontrada" para id inexistente, de outra pessoa ou inválido (o mesmo 404).
- [ADR 0017](adr/0017-excluir-conta-apaga-movimentacoes.md): excluir conta apaga as movimentações.
#### Corrigido
- Botões de 32–40 px passam a ter alvo de toque de 44 px (pendência T8) e o vermelho de despesa no card escuro passa de 3,71:1 para 4,68:1 (pendência T10).
- Apagar categoria com transações falhava pela FK composta (pendência T11).
#### Segurança
- Auditoria completa (T15): nenhum achado crítico ou alto. Corrigido o SEC-001: um cookie de refresh inventado fazia a API chamar o Supabase a cada request; agora o refresh recusado encerra a sessão e as tentativas têm limite de 30 por minuto por IP.

### 2026-10-15 — Etapa 3 concluída: autenticação (spec 001)
#### Adicionado
- API ASP.NET Core (.NET 10, Clean Architecture) e front React + Vite em `web/`, na mesma origem ([ADR 0013](adr/0013-api-aspnet-e-front-react-vite.md)); o Next.js saiu.
- Cadastro, entrar e sair com sessão em cookies `httpOnly` (`velos_at`/`velos_rt`), renovação automática do token, CSRF por header `X-Velos-Csrf`.
- Banco acessado só pela API, com o role `velos_api` (sem `bypassrls`) e a RLS valendo em toda query (`0007`).
- Bloqueio de tentativas: 5 senhas erradas → 10 min, aviso da 3ª em diante, tela de bloqueio com relógio; vale para email sem conta ([ADR 0014](adr/0014-bloqueio-de-tentativas-de-login.md); `0005`, `0008`).
- Login com Google e recuperação de senha, os dois com PKCE feito pela API; telas `/recuperar-senha`, `/redefinir-senha` e `/auth/erro`.
- Modelos de email de recuperação e confirmação com a identidade Velos (`supabase/templates/`, publicação adiada com o C3) e `npm run preview:emails`.
- Limite de requisições por IP nas rotas de autenticação e cabeçalhos de segurança (`X-Frame-Options`, `frame-ancestors`, `nosniff`, `Referrer-Policy`, HSTS em produção).
- ADRs [0014](adr/0014-bloqueio-de-tentativas-de-login.md) (bloqueio) e [0015](adr/0015-rotas-privadas-por-padrao.md) (rotas privadas por padrão).
- 120 testes xUnit (Domain, Application e integração com o banco).
#### Corrigido
- Proxy do Vite trocava o `Host`, e os endereços de volta do Google e do email saíam fora da lista do Supabase.
- Endereços de volta passam a vir de `App:PublicOrigin`, nunca do `Host` da request (Host forjado chegava ao link).
- Redirect `/..//site.com` virava `//site.com` depois de normalizado; agora a saída também é conferida.
- Tentativas de login em paralelo passavam do limite de 5 (agora a tentativa é reservada no banco antes de chamar o Supabase).
- Tempo de bloqueio aparecia como "11 minutos" com o relógio da API atrás do banco.
- "Sair" passa a apagar também os cookies dos fluxos de recuperação e Google.
- Mensagens próprias para link de recuperação vencido, troca de senha sem o link e falha do Google (antes: "tente de novo").
- Erros de campo e a confirmação do "Esqueci minha senha" anunciados ao leitor de tela.
#### Configuração (painel)
- Supabase: *Confirm email* desligada (estava ligada contra a Revisão 1 da spec), Google ligado (C4/C5), Data API (`/rest/v1`) desligada.
#### Pendente
- CA7 (recuperação de ponta a ponta com o email chegando) e CA16 (aparência do email nos clientes) — ver [ROADMAP](ROADMAP.md).

### 2026-10-15 — Limpeza do repositório
#### Alterado
- Logos originais da raiz movidos para `media/brand/`; projeto do vídeo de lançamento versionado em `media/video-lancamento/` (só a fonte; MP4 e capturas ficam fora do Git).
- Material de divulgação (Instagram, LinkedIn) reunido em `media/` e ignorado pelo Git.
#### Removido
- `supabase/migrations/.gitkeep` (gerava aviso em todo comando da CLI).

### 2026-10-12 — Cores revisadas pelo Pedro (spec 003)
#### Alterado
- Verde escuro passa a ser o tema padrão de quem ainda não escolheu ([ADR 0016](adr/0016-verde-escuro-como-tema-padrao.md)); a barra do navegador acompanha o tema aplicado.
- Tela do iPhone da vitrine sempre no tema oposto ao da página, para o aparelho nunca se misturar com o fundo.
- Tema claro menos branco: fundo `#ECF1EA` (antes `#F4F7F2`) e cartões `#F5F8F3` (antes `#FFFFFF`). Para manter tudo ≥ 4,5:1, escureceram muted `#576E66`, despesa `#C1393E`, receita e foco `#197A50` e borda de campo `#738880` (3,30:1).
- Painel das telas de entrada: promessas logo abaixo da frase e, a partir de 1280 px, três cartões do app (salário, mercado, meta) flutuando na moldura do iPhone.

### 2026-10-12 — Página inicial (spec 003)
#### Adicionado
- Página pública em `/`: composição "Tudo converge" (quatro contas ligadas por fios ao iPhone desenhado em CSS), abas acessíveis Contas · Mês · Gastos · Metas, número que rola como contador, seções com o iPhone fixo no desktop, faixa "Privado por padrão" em tema invertido, fechamento "Sem loja de apps.", barra fixa "Criar conta" no celular, rodapé com @veloswallet.
- Vitrine do app reutilizável em `web/src/features/showcase/` (tamanhos hero, compact, peek e mini), com dados de exemplo rotulados.
- `DESIGN.md` e `.impeccable/design.json`: o sistema visual documentado a partir do código.
#### Alterado
- Painel das telas de entrada: o bloco de contas virou o iPhone compacto com abas.
- `/` para visitante mostra a página; logado vai ao painel (`GuestOnly`); `RootRedirect` removido.
- Entrar, cadastro, painel e 404 carregam sob demanda (`lazy()`).
- `ThemeToggle` ganhou a variante só com ícone.
#### Corrigido
- Linha destacada no iPhone não troca mais o fundo (o vermelho da dívida sobre card escuro dava 3,71:1).

### 2026-10-12 — Documentação SDD
#### Adicionado
- Pasta `docs/` no padrão Spec-Driven Development: `VISAO`, `ARQUITETURA`, `ROADMAP`, `LICOES`, `CHANGELOG`, 12 ADRs e templates de spec/plan/tasks.
#### Alterado
- `CLAUDE.md` enxugado: as regras ficam, os detalhes passam para `docs/`, com indicação de qual arquivo ler em cada situação.
- Etapas renumeradas para 8, alinhadas com os comentários do código.

### 2026-10-12 — Etapa 2 concluída: banco em produção (PR #1)
#### Adicionado
- `supabase` CLI como devDependency (`407d349`).
- `database.types.ts` gerado do schema real: 6 tabelas, 3 views, 2 enums (`bf0e188`).
#### Alterado
- Projeto Supabase recriado em **sa-east-1 (São Paulo)**; o anterior, em us-west-2, foi descartado ainda vazio (`bf0e188`).
- Migrations `0001`–`0004` aplicadas via `supabase db push`, com histórico registrado.
- `types:db` usa `--linked` em vez de `$SUPABASE_PROJECT_ID`, que não funcionava no Windows (`407d349`).
- `CLAUDE.md`: projeto/região, comando `db push`, regra de nunca colar migrations no SQL Editor (`8d4a4a6`).
#### Corrigido
- Histórico local integrado ao "Initial commit" criado pelo GitHub, sem `push --force` (`de4bda8`).
#### Segurança
- RLS verificada na prática: sem sessão, `categories`, `transactions` e `account_balances` devolvem `[]`.

### 2026-10-11 — Etapa 2: migrations escritas (`0f7455b`)
#### Adicionado
- `0001_init.sql`: tabelas `profiles`, `accounts`, `categories`, `transactions`, `goals`, `goal_contributions`; enums `account_type` e `transaction_type`; índices.
- FK composta `(category_id, type)` impede despesa em categoria de receita; FKs `(account_id, user_id)` impedem usar conta alheia; CHECK de forma da transferência.
- `0002_rls.sql`: RLS nas 6 tabelas, 23 policies por comando com `(select auth.uid())`.
- `0003_triggers_seed.sql`: `set_updated_at` e `handle_new_user` (profile + 10 categorias padrão).
- `0004_views.sql`: `account_balances`, `monthly_summary`, `goal_progress`, todas com `security_invoker = on`.

### 2026-10-11 — Etapa 1: setup do projeto (`e6174fa`)
#### Adicionado
- Next.js 15.5.27 + React 19.1 + TypeScript strict, App Router com Turbopack.
- Tailwind v4 (CSS-first) e shadcn/ui sobre `@base-ui/react`.
- Clients Supabase via `@supabase/ssr` (browser, server, middleware de sessão).
- Identidade visual nos tokens: `#0A2E24` marca, `#2ED38C` dinheiro, `#F4F7F2` fundo; `--income`/`--expense` com contraste WCAG verificado nos dois temas.
- `formatCurrency`, `formatSignedCurrency`, `parseCurrencyInput`, `toCents` (centavos, sem float).
- Helpers de data com `parseISO`, evitando o desvio de fuso em UTC-3.
- Tema claro/escuro por script inline + `ThemeToggle`, sem dependência extra.
- Scripts `typecheck`, `lint` e `types:db`.

### 2026-10-11 — Início
- Repositório inicializado (`664ec49`).
- `CLAUDE.md` com stack, regras e modelo de dados (`e951555`).
