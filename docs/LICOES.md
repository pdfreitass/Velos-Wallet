# Lições aprendidas

> Leia **antes de começar uma etapa** e sempre que algo "estranho" acontecer: é provável que já tenha acontecido antes.
> Ao terminar uma feature, acrescente aqui o que deu errado (ou quase) e como evitar. Lições mais recentes ficam no topo.

Formato de cada lição: **o que aconteceu → por que → como evitar → onde a regra mora agora**.

---

## L49 — Senha de teste fixa no código, em repositório público
*2026-11-07 · commit `08c1ec3`, encontrada pela revisão `security` da spec 013*

- **O que aconteceu:** a sonda E2E cadastrava uma conta por execução com a senha `Velos-E2E-Sonda-123!` escrita no `helpers.ts`. O repositório é **público**, e nenhuma dessas contas era apagada: ficaram **7 usuários vivos em produção com senha conhecida por qualquer pessoa que lesse o repo**. Não há dado financeiro real neles, mas são sessões autenticadas de verdade — dá para exercitar toda a superfície privada da API, sondar IDOR, escrever movimentações e queimar as cotas de `/token` e de email.
- **Por que:** o teste precisava de credenciais e ninguém perguntou "e se isto for lido por um estranho?". A senha parecia inofensiva porque a conta era "de teste" — mas a conta era **de produção**.
- **Como evitar:** teste que se autentica contra produção lê credenciais do **ambiente**, nunca do repositório, e usa uma conta **dedicada** cujo endereço também não aparece no repo (nomear a caixa é entregar metade do par). Teste que **cria** usuário em produção precisa saber apagá-lo; se não sabe, reutiliza uma conta fixa e limpa os dados no `finally`. E senha exposta é senha queimada: não se reaproveita, apaga-se o que a aceita.
- **Onde a regra mora:** `web/e2e/helpers.ts` (`requireEnv`) e a [revisão do ADR 0022](adr/0022-testes-e2e-com-playwright.md).

## L48 — Apagar conta de teste da produção quebra os testes de integração
*2026-11-07 · spec 013*

- **O que aconteceu:** `dotnet test api` passou a falhar **24 dos 33** testes de integração, todos com `validation_failed`. O erro real, escondido lá no fundo, era `23503: insert or update on table "accounts" violates foreign key constraint "accounts_user_id_fkey"`: o `Tests:UserId` dos user-secrets aponta para um usuário que **já não existe** em `auth.users` — foi apagado numa limpeza de contas de teste.
- **Por que:** o `DatabaseFactAttribute` pula o teste quando **falta** a connection string ou o `Tests:UserId`, mas não confere se o usuário ainda existe. Com um id que aponta para o vazio, ele não pula: falha. E o `StoreGuard` traduz FK/check/not null para `validation_failed`, que não diz nada sobre a causa.
- **Como evitar:** antes de apagar conta de teste da produção, conferir se ela não é o `Tests:UserId`. Ao ver `validation_failed` em massa nos testes de integração, ler a exceção do Postgres antes de procurar regressão no código — provavelmente é ambiente, não código.
- **Onde a regra mora:** `api/tests/Velos.Infrastructure.IntegrationTests/DatabaseFactAttribute.cs` (que ganharia muito em conferir a existência do usuário e pular com recado claro).

## L47 — Mudar a premissa de uma sonda E2E exige varrer a documentação
*2026-11-07 · spec 013 (T6), ADR 0022*

- **O que aconteceu:** a sonda `probe` deixou de cadastrar uma conta descartável e passou a entrar numa conta fixa. O código ficou certo em minutos; **seis lugares continuaram dizendo "conta descartável"**: o comentário do `playwright.config.ts`, o ADR 0022, o `ARQUITETURA.md`, o `CHANGELOG.md`, o `ci.yml` e a lição L45 aqui embaixo.
- **Por que:** a premissa de um teste vaza para a documentação inteira, porque é ela que explica *por que* o teste é daquele jeito. Quem muda o teste vê só o arquivo do teste.
- **Como evitar:** ao mudar o modelo de dados de uma sonda, rodar um `grep -rn` pelo termo antigo (`descartável`, `e2e-probe`) em `docs/`, `.github/` e nos comentários, e atualizar tudo **no mesmo commit**. Documentação que descreve comportamento envelhece em silêncio.
- **Onde a regra mora:** [ADR 0022](adr/0022-testes-e2e-com-playwright.md), na seção "Revisão — 2026-11-07".

## L46 — Num caminho de erro, o recado errado custa mais que o erro
*2026-11-07 · spec 013*

- **O que aconteceu:** quem se cadastrava no celular e abria o email de confirmação no computador — o caminho **mais comum** — via "Este link não é mais válido. Peça outro". Pedia outro link, abria noutro navegador de novo, e repetia. A conta já estava confirmada desde o primeiro clique: só faltava **entrar**.
- **Por que:** a troca PKCE precisa do verificador, que mora num cookie do navegador onde a pessoa se cadastrou. Sem ele a troca falha — e "a troca falhou" tinha sido traduzido para "o link não vale", que é outra coisa. Um único desfecho de erro cobria três situações diferentes.
- **Como evitar:** antes de escrever a mensagem de um caminho de erro, listar **todas** as situações que caem ali e perguntar, uma a uma, "o que esta pessoa deveria fazer agora?". Se a resposta muda, a mensagem tem de mudar junto. Aqui o sinal estava no banco o tempo todo: `email_confirmed_at` preenchido com `last_sign_in_at` nulo é a assinatura exata de quem confirmou e nunca conseguiu entrar.
- **Armadilha 1 — não inferir o que o provedor declara.** A primeira versão deduzia "foi confirmado" da *ausência* de `error`, e a spec registrou isso como "premissa a verificar à mão". O GoTrue manda `error` e `error_code` (ex.: `otp_expired`) na própria volta: ler esses parâmetros **primeiro** troca uma premissa por um contrato, e custa duas linhas.
- **Armadilha 2 — o desfecho novo engole o sinal de ataque.** Cookie de verifier adulterado ou de outro fluxo também cai em "sem verifier". Logar esse caso (cookie veio e não desprotegeu), senão a tentativa fica invisível.
- **Onde a regra mora:** [ADR 0023](adr/0023-confirmacao-de-email-tres-desfechos.md), RN9 da [spec 013](specs/013-confirmacao-de-email/spec.md) e `AuthCallbackController.ConfirmSignUp`.

## L45 — E2E contra a produção: conta descartável, asserts exatos e a árvore de acessibilidade
*2026-11-03 · spec 009/012, ADR 0022*

- **O que aconteceu:** a primeira suíte E2E do projeto tropeçou três vezes em armadilhas de quem nunca testou o próprio app de fora: (1) o assert `/categorias` **passava** com a página ainda em `/categorias/nova` — a criação da categoria tinha falhado e o teste seguia como se nada tivesse acontecido; (2) o campo de data não era localizável pelo placeholder "Escolha a data", porque o **nome acessível do botão vem do label do campo** ("Data"); (3) o CDP devolve `installabilityErrors`, não `errors`.
- **Por que:** testar contra a produção significa testar o app como um usuário — inclusive os detalhes de acessibilidade que o código "correto" esconde. Assert de URL por prefixo é assert fraco; placeholder não é rótulo; e protocolo de navegador tem seus próprios nomes de campo.
- **Como evitar:** em testes E2E, **todo passo que salva tem de provar que salvou** (URL exata + o item aparecendo na lista seguinte). Localizar por **nome acessível** (o que o leitor de tela veria) e, na dúvida, consultar o snapshot que o Playwright gera na falha — ele mostra a árvore de acessibilidade da página inteira. E as sondas contra produção vivem num projeto separado (`probe`), com limpeza, fora do CI de rotina. (A conta descartável por execução saiu em 2026-11-07 — ver a **L47**.)
- **Onde a regra mora:** [ADR 0022](adr/0022-testes-e2e-com-playwright.md) e os helpers de `web/e2e/helpers.ts`.

## L44 — TanStack Query "online" pausa queries offline para sempre
*2026-11-03 · spec 009 (CA6)*

- **O que aconteceu:** ao testar o CA6 (app sem internet), a tela de Transações ficava eternamente em "Carregando as transações…". O E2E com Playwright mostrou que **nenhuma requisição era disparada**: o TanStack Query, no `networkMode` padrão (`"online"`), **pausa toda query nova quando `navigator.onLine` é falso**. O estado de erro com "Tentar de novo" nunca chegava — e o usuário real veria um skeleton infinito, não o erro de conexão que a spec 009 promete (RN1/CA6).
- **Por que:** o padrão foi desenhado para "não gastar bateria tentando à toa" — mas esconde do usuário que a rede caiu, e pior: deixa saldo antigo na tela como se fosse atual. A spec já dizia o comportamento correto; o código padrão o contradizia em silêncio.
- **Como evitar:** critérios de **offline** têm de ser exercitados de verdade (cortando a rede numa sessão logada), não só raciocinados. No TanStack Query, apps que mostram estado de erro explícito usam `networkMode: "always"` — a query falha rápido e a UI decide. Deixar um teste de unidade prendendo a configuração, porque a regressão aqui é invisível nos testes de componente.
- **Onde a regra mora:** `web/src/lib/api/query-client.ts` (comentário + teste `query-client.test.ts`) e o E2E `probe` em `web/e2e/simulation.spec.ts`.

## L43 — Feature analítica não se testa com os dados que existem
*2026-11-03 · spec 012*

- **O que aconteceu:** a simulação de corte ficou pronta, com 386 testes na API e 58 no front, tudo verde. Ao abrir a tela no navegador, ela mostrava corretamente… *"Ainda não dá para simular"*. É o estado certo — os dados reais eram 8 transações de dois dias — mas não exercitava nada do que tinha sido construído. Para ver a tela de verdade foi preciso **semear** três meses de despesa numa conta de teste, conferir, e apagar tudo depois.
- **Por que:** uma feature que lê histórico só tem o que mostrar quando o histórico existe. Os testes cobrem os cenários porque os constroem; a tela, não — ela mostra o que o banco tem. Num app novo, o estado "sem dados" é o estado **normal**, e é fácil confundir "a tela funciona" com "a tela está vazia e eu não reparei".
- **Como evitar:** antes de dar por verificada uma tela que depende de histórico, perguntar **quais dados existem agora**. Se o cenário real é o estado vazio, semear os outros cenários numa conta de teste, conferir à mão, e apagar — confirmando no fim que só os dados semeados sumiram. E marcar na spec **como** cada critério foi verificado: "passou no teste" e "vi na tela" não são a mesma garantia.
- **Onde a regra mora:** [spec 012 → Critérios de aceite](specs/012-simulacao-de-corte/spec.md), que agora diz ao lado de cada um se foi navegador, teste, ou os dois.

## L42 — Cálculo duplicado entre front e API precisa de um teste que prenda os dois
*2026-11-03 · spec 012*

- **O que aconteceu:** a simulação recalcula o corte em memória enquanto a pessoa move o percentual, para não ir à rede a cada ajuste. Isso obriga a mesma aritmética a existir em C# e em TypeScript — com o mesmo arredondamento ao centavo, que não é óbvio: arredonda-se **uma vez só**, no valor mensal, e as projeções multiplicam o já arredondado. Arredondar noutra ordem faz 12× o número da tela não bater com o número da tela.
- **Por que:** duplicação deliberada por desempenho é legítima, mas as duas cópias envelhecem em silêncio. Nada no compilador liga uma à outra.
- **Como evitar:** quando a duplicação for deliberada, escrever **os mesmos números à mão dos dois lados** — aqui, os casos do CA1 e do CA2 em `SimulationRulesTests.cs` e em `simulation-math.test.ts`, com um comentário em cada ficheiro a apontar para o outro. Se alguém mexer num, o outro fica vermelho.
- **Onde a regra mora:** [plan.md da spec 012](specs/012-simulacao-de-corte/plan.md) → *Resumo da abordagem*.

## L41 — A vitrine de marketing cria expectativa de produto
*2026-11-02 · spec 010*

- **O que aconteceu:** a página inicial mostrava os gastos numa rosca e o app mostrava barras. O Pedro abriu o Início, não reconheceu o bloco e disse que "o dashboard não está ali", mandando como referência a tela da própria vitrine. Quando fui verificar, respondi que já estava feito — eu tinha olhado para o bloco, ele estava a falar do desenho.
- **Por que:** a vitrine e o app desenhavam a mesma informação em dois sítios, de formas diferentes, sem nada a ligá-los. Cada um evoluiu por seu lado, e a divergência só aparece quando alguém compara.
- **Como evitar:** o que a página inicial mostra é uma promessa. Telas de exemplo e telas reais da mesma informação partilham componente, ou a divergência volta. E antes de responder "já está", confirmar que é a **mesma coisa** que a pessoa está a pedir, não só o mesmo nome.
- **Onde a regra mora:** [ADR 0019](adr/0019-rosca-de-categorias-em-css.md) e [spec 010](specs/010-rosca-de-categorias/spec.md).

## L40 — "O email chegou" não é o mesmo que "o email está certo"
*2026-11-02 · pré-deploy, T9*

- **O que aconteceu:** com o Resend verificado, o email de recuperação passou a chegar — remetente certo, caixa de entrada, link funcionando. Tudo parecia pronto. Mas o corpo estava **em inglês**: *"Reset your password. We received a request…"*. Era o template padrão do GoTrue, não o `supabase/templates/recovery.html` do repositório.
- **Por que:** os modelos vivem em dois sítios. O repositório guarda o HTML, mas **quem manda é o painel do Supabase**, e publicar lá é manual e fora do git. Até 2026-10-13 o Supabase nem deixava editar modelo sem SMTP próprio, por isso o passo C3 ficou parado e ninguém reparou — ninguém tinha visto um email real antes.
- **Como evitar:** ao ligar um provedor de email, não parar em "o fluxo funciona". **Abrir o email e lê-lo**: idioma, remetente, assunto, aparência. Depois de publicar modelo no painel, enviar um de teste e conferir que é mesmo o do repositório.
- **Onde a regra mora:** [ROADMAP → item 3 do pré-deploy](ROADMAP.md); a regra de idioma está no `CLAUDE.md` (*interface e mensagens em português do Brasil, com acento*).

## L39 — Falha de envio de email aparece como erro genérico: a causa só está nos auth logs
*2026-11-02 · pré-deploy, T9*

- **O que aconteceu:** ao pedir o link de recuperação, o front mostrou *"Não foi possível falar com o servidor de autenticação"* e o log da API registrou só `HTTP 500, código unexpected_failure`. Nada dizia **por que**. A causa real estava nos **auth logs do Supabase**: `550 "The veloswallet.com.br domain is not verified"` — o Resend recusou o envio porque o domínio ainda não tinha sido verificado no painel, mesmo com o DNS já publicado.
- **Por que:** o GoTrue não devolve o erro do SMTP na resposta HTTP (e é certo que não devolva — vazaria infraestrutura). Ele vira `unexpected_failure`, e a API, corretamente, não vaza mensagem do Supabase.
- **Como evitar:** diante de `unexpected_failure` em qualquer rota de email (`/recover`, `/signup`, `/resend`), **ir direto aos auth logs** antes de suspeitar do código. O campo `error` do evento traz a mensagem do SMTP inteira.
- **Onde a regra mora:** [ROADMAP → O que falta, item 1](ROADMAP.md).

## L38 — Conferir DNS no servidor errado faz parecer que a zona não publicou
*2026-11-02 · pré-deploy, Registro.br*

- **O que aconteceu:** o pré-deploy ficou parado ~1 dia com a nota "o DNS ainda não responde", porque o `nslookup` era feito contra `a.auto.dns.br`. Os registros estavam publicados desde o início: o domínio está delegado a **`a.sec.dns.br` / `c.sec.dns.br`**.
- **Por que:** o `a.auto.dns.br` responde SOA para o domínio (e até declara `NS = a.auto/b.auto`), mas não serve a zona publicada — devolve *Non-existent domain* para tudo, o que a olho é idêntico a "ainda não propagou".
- **Como evitar:** nunca assumir o servidor autoritativo. Primeiro `nslookup -type=NS <domínio> 8.8.8.8` para descobrir a delegação real, depois consultar **esse** NS, e só então confirmar a propagação num resolver público.
- **Onde a regra mora:** [ROADMAP → Infraestrutura já contratada](ROADMAP.md).

## L37 — Rastreamento de cliques quebra link de uso único
*2026-11-02 · pré-deploy, Resend*

- **O que aconteceu:** ao adicionar o domínio no Resend, o **click tracking vinha ligado por padrão**. Ele reescreve todo link do email para passar por um domínio de rastreio antes de redirecionar.
- **Por que importa aqui:** o link de recuperação de senha é **de uso único**. Qualquer scanner de email corporativo, antivírus ou preview de link que siga o endereço **consome o código** — e o clique da pessoa falha. É uma das causas clássicas de "o link não funciona". Fora que coletar cliques contraria o princípio *"Privado por padrão"* da [VISAO](VISAO.md).
- **Como evitar:** em email transacional, click tracking e open tracking **desligados**. Conferir na criação do domínio, não depois.
- **Regra em:** painel do Resend, domínio `veloswallet.com.br` → *Advanced options*.

## L36 — O navegador embutido do Claude não registra service worker
*2026-11-01 · spec 009 (PWA) e SEC-004*

- **O que aconteceu:** depois de ligar a CSP completa, o service worker parou de registrar com *"An unknown error occurred when fetching the script"*. Culpei a CSP e mudei o middleware para mandar a política só no HTML.
- **Por que:** era falso. No **Chrome de verdade** o SW registra normalmente, **com** a CSP em toda resposta — o navegador embutido simplesmente não suporta service worker. A mudança foi revertida.
- **Como evitar:** PWA e service worker se testam no Chrome, nunca no painel embutido. E mudança de comportamento justificada por hipótese não confirmada **se reverte**, não se mantém "porque também é defensável".
- **Regra em:** `api/src/Velos.Api/Configuration/SecurityHeadersMiddleware.cs` (a CSP vai em toda resposta, como a revisão de segurança anterior exigia).

## L35 — Modo avançado do Registro.br tem dois pedágios
*2026-11-01/02 · pré-deploy, DNS*

- **O que aconteceu:** criar TXT e CNAME exige o **modo avançado** da zona. Ao ligar, (a) a volta ao modo básico fica **travada por 2 horas** e (b) o domínio entra em **"em transição"** e recusa registros por alguns minutos.
- **E depois:** salvar **não é** publicar. Os registros persistem no painel na hora, mas o DNS só responde quando o Registro.br publica a zona, em lotes.
- **Como evitar:** conferir no servidor autoritativo, não no resolver local — `nslookup -type=TXT <nome> a.auto.dns.br`. E conferir os valores no DOM antes de salvar: a chave DKIM aparece truncada na tela, e é onde um erro passa despercebido.
- **Regra em:** [ROADMAP](ROADMAP.md), seção "Antes do deploy em produção".

## L34 — Hover com opacidade derruba o contraste que o estado normal tinha
*2026-11-01 · spec 006, T8*

- **O que aconteceu:** o botão de confirmar exclusão virou cor sólida e passou a medir 5,69:1, mas o hover era `bg-destructive/80`: a opacidade deixa o fundo do cartão aparecer por baixo, o fundo clareia e o contraste cai para 4,22:1 (escuro) e 3,63:1 (claro).
- **Por que:** medir só o estado de repouso. Um fundo com alfa não é uma cor: depende da superfície atrás dele, que muda entre cartão, popover e página.
- **Como evitar:** ao mexer num componente de `ui/`, medir **repouso e hover**, nos dois temas. Para escurecer/clarear sem perder contraste, usar `color-mix(in oklch, <cor>, var(--foreground) N%)`, que o `secondary` já usava, em vez de reduzir a opacidade.
- **Regra em:** `web/src/components/ui/button.tsx` (variante `destructive`) e os contrastes anotados em `web/src/styles/globals.css`.

## L33 — Porcentagem arredondada mente nos extremos
*2026-11-01 · spec 006, T8*

- **O que aconteceu:** `Math.round(current / target * 100)` mostrava a barra cheia e "100%" ao lado de "Faltam R$ 10,00", e "0%" com barra vazia depois do primeiro aporte pequeno.
- **Por que:** o arredondamento alcança os extremos antes do estado real: 99,5% vira 100 e 0,4% vira 0.
- **Como evitar:** em barra de progresso, os extremos vêm do **estado** (atingida = 100, nada guardado = 0) e o arredondamento fica preso entre 1 e 99.
- **Regra em:** `web/src/features/goals/GoalProgress.tsx` (`progressPercent`).

## L32 — Testes de integração em paralelo misturavam os totais do mesmo usuário
*2026-10-18 · spec 005, T4*

- **O que aconteceu:** `DashboardStoreTests` comparava a contagem de contas "antes/depois" e às vezes dava 0 em vez de 2: outras classes, rodando ao mesmo tempo com o mesmo usuário de teste, criavam e apagavam contas no meio.
- **Por que:** o xUnit roda classes diferentes em paralelo por padrão, e o banco real é compartilhado.
- **Como evitar:** testes de integração contra o banco real rodam em sequência.
- **Regra em:** `api/tests/Velos.Infrastructure.IntegrationTests/AssemblyInfo.cs` (`DisableTestParallelization`).

## L31 — Teste que depende de view nova falha até a migration ser aplicada
*2026-10-18 · spec 005*

- **O que aconteceu:** dois testes do dashboard falharam (`database_unavailable` e totais zerados) e pareciam bug, mas a view `category_spending` ainda não existia no banco.
- **Como evitar:** antes de diagnosticar, rodar `npx supabase db push --dry-run`; se a migration da task está pendente, aplicar (com a aprovação do Pedro) e rodar `dotnet test` de novo. Em query de soma com `join` numa tabela de apoio, pôr `user_id` também na condição do `join`.

## L30 — Mockup HTML com JavaScript não aparece inteiro no visualizador do celular
*2026-10-17 · spec 002*

- **O que aconteceu:** o `mockup.html` enviado ao celular apareceu sem ícones nem as grades de cor e ícone: o visualizador não roda os scripts nem o lucide do CDN.
- **Como evitar:** para revisão no celular, mandar PNG de cada tela (Playwright, `locator.screenshot`); o HTML fica para abrir no navegador do PC.

## L29 — Invalidar a lista depois de excluir também refaz o GET do item excluído
*2026-10-17 · spec 002, T11*

- **O que aconteceu:** `invalidateQueries(["accounts"])` também invalida `["accounts", id]`; com a tela de edição ainda montada, o React Query buscou a conta apagada e recebeu 404.
- **Como evitar:** depois do `DELETE`, `removeQueries` no item e `invalidateQueries` com `predicate` (ou `exact: true`) que deixa o item de fora.
- **Regra em:** `useDeleteAccount` e `useDeleteCategory` (`features/*/api.ts`).

## L28 — Contraste "de antes" escrito de memória estava errado
*2026-10-17 · spec 002, T9*

- **O que aconteceu:** no comentário dos tokens das categorias, os valores do hex original ("2,67" e "1,87") foram escritos sem medir; os reais eram 2,53 e 1,81. A contagem de cores ajustadas também saiu errada (eram as 12, não 9).
- **Como evitar:** todo número de contraste em comentário sai de um script de medição (luminância WCAG), inclusive o "antes"; contagens saem da tabela final, não de cabeça.

## L27 — Cookie de refresh inventado fazia a API chamar o Supabase a cada request
*2026-10-17 · spec 002, T15 (auditoria de segurança)*

- **O que aconteceu:** o `TokenRefreshMiddleware` tentava renovar com qualquer `velos_rt`, inclusive inventado, em rotas sem rate limit. O GoTrue responde `validation_failed`, tratado como "indisponível", e o cookie nunca era apagado. Como o Supabase limita por IP — o da API —, isso esgotaria a cota de renovação de todos (a mesma raiz da L24).
- **Como foi resolvido:** refresh recusado com 4xx (exceto 429) vira sessão encerrada; as tentativas de refresh têm limite de 30/min por IP no middleware.
- **Como evitar:** toda chamada da API a um serviço externo disparada por dado do cliente (cookie, header, corpo) precisa de limite por cliente na API, inclusive as que acontecem em middleware, fora das rotas de auth.
- **Regra em:** `RateLimitingSetup.CreateRefreshLimiter` e [ARQUITETURA → Sessão](ARQUITETURA.md#sessão).

## L26 — Código de erro novo na API sem mensagem no front vira "tente de novo"
*2026-10-15 · spec 001, T23 (agente `qa`)*

- **O que aconteceu:** `reset_link_invalid`, `reset_not_allowed`, `google_failed` e `session_expired` não estavam em `OWN_MESSAGES`. Com o link de recuperação vencido, a tela dizia "Algo deu errado. Tente de novo", o que nunca resolve.
- **Como evitar:** ao criar um `AppError` na API, abrir também `web/src/features/auth/errors.ts` e incluir o `code`.
- **Regra em:** comentário de `OWN_MESSAGES` em `errors.ts`.

## L25 — Conferir e registrar em transações separadas abre corrida
*2026-10-15 · spec 001, T23 (agente `security`)*

- **O que aconteceu:** o login consultava o bloqueio, chamava o Supabase e só depois registrava a falha. 8 tentativas em paralelo para o mesmo email chegavam as 8 ao Supabase, passando do limite de 5.
- **Como foi resolvido:** a migration `0008` reserva a tentativa ANTES, com `select ... for update`; agora chegam 5.
- **Como evitar:** contador de segurança se reserva atomicamente antes da ação, nunca "lê, age, registra".
- **Regra em:** [ADR 0014](adr/0014-bloqueio-de-tentativas-de-login.md), `0008_reserve_login_attempt.sql`.

## L24 — Com a API no meio, o limite por IP do Supabase enxerga um IP só
*2026-10-15 · spec 001, T23 (agente `security`)*

- **O que aconteceu:** o ADR 0014 contava com "o limite por IP do Supabase, por cima". Mas a API chama o Supabase servidor a servidor: para ele, todo usuário tem o IP da API, e um atacante travaria o login de todo mundo.
- **Como evitar:** o limite por cliente passa a ser responsabilidade da API (`RateLimitingSetup`). Em produção, `ForwardedHeaders` restrito ao proxy para enxergar o IP real.
- **Regra em:** [ARQUITETURA → Sessão](ARQUITETURA.md#sessão).

## L23 — Endereço público vem de configuração, nunca do `Host` da request
*2026-10-15 · spec 001, T23 (agente `security`)*

- **O que aconteceu:** os links de volta do Google e do email eram montados com `Request.Scheme + Request.Host`. Um `Host` forjado chegava ao link; atrás do proxy TLS o esquema viraria `http`, e a correção "fácil" (curinga nas Redirect URLs) permitiria roubar o `code` do PKCE e tomar a conta pela recuperação.
- **Como evitar:** `App:PublicOrigin` na configuração; Redirect URLs do Supabase exatas, sem curinga de host.
- **Regra em:** `api/src/Velos.Api/Configuration/PublicOrigin.cs`, [ROADMAP → antes do deploy](ROADMAP.md).

## L22 — Validar a saída de um redirect, não só a entrada
*2026-10-15 · spec 001, T23 (agente `security`)*

- **O que aconteceu:** `/..//site.com` passava na checagem de `//` e virava `//site.com` depois que o parser de URL removia o `..`.
- **Como evitar:** toda sanitização que normaliza confere o resultado de novo.
- **Regra em:** `SafeRedirect.cs` e `redirect.ts` (+4 casos de teste).

## L21 — Tempo vindo de outro relógio precisa de limite
*2026-10-15 · spec 001, T22*

- **O que aconteceu:** o fim do bloqueio vem do relógio do banco; com o desta máquina 5 s atrasado, a tela dizia "11 minutos" para um bloqueio de 10.
- **Como evitar:** valor de tempo calculado entre dois relógios fica entre limites conhecidos (`Math.Clamp`).
- **Regra em:** `LoginLockoutPolicy.MinutesLeft`.

## L20 — "Confirm email" ligada no painel, contra a decisão da spec
*2026-10-15 · spec 001, T22*

- **O que aconteceu:** o cadastro falhava com `email_address_invalid` (para `@example.com`) e depois `over_email_send_rate_limit`. Os dois só aparecem quando o Supabase **tenta enviar email** no cadastro: a *Confirm email* estava ligada, contra a Revisão 1 da spec. O limite de email é por hora, e travou os testes.
- **Como evitar:** o log da API registra o código exato do Supabase ("Supabase Auth recusou {endpoint}: HTTP x, código y"): ler antes de supor. Contas de teste com domínio que tenha MX (`@mailinator.com`), nunca `@example.com`.
- **Regra em:** [ARQUITETURA → Auth](ARQUITETURA.md#auth).

## L19 — Proxy do Vite na forma curta troca o `Host`
*2026-10-15 · spec 001, T22*

- **O que aconteceu:** `"/api": url` liga `changeOrigin` sem avisar. A API recebia `localhost:5080` em vez de `localhost:3000`.
- **Como evitar:** escrever o proxy por extenso, `{ target, changeOrigin: false }`, e não depender do `Host` para nada importante (L23).
- **Regra em:** comentário em `web/vite.config.ts`.

## L18 — Heredoc no Bash do agente come barras invertidas
*2026-10-12 · spec 001, T10*

- **O que aconteceu:** um arquivo de teste criado por heredoc saiu com `\\` virando `\`, e pareceu que uma regex estava quebrada.
- **Como evitar:** código com barras invertidas se cria com a ferramenta de escrever arquivo, não por heredoc.

## L17 — Smart App Control do Windows bloqueou DLL do `dotnet build`
*2026-10-12 · spec 001, T13*

- **O que aconteceu:** "Uma política de Controle de Aplicativo bloqueou este arquivo" (0x800711C7) na `Velos.Application.dll`. Bloqueio por reputação, parece aleatório (a DLL da T11 passou).
- **Como foi resolvido:** o Pedro desligou o Smart App Control. Alternativa: .NET no WSL2.
- **Como evitar:** é pré-requisito de máquina para desenvolver no Windows 11.

## L16 — Entrada de MCP que instalava em vez de iniciar
*2026-10-12*

- **O que aconteceu:** a entrada `firecrawl` do `~/.claude.json` tinha como comando `npm install -g firecrawl-mcp`, que instala e termina; o servidor nunca subia.
- **Como foi resolvido:** trocada pela versão HTTP com OAuth.

## L15 — Git Bash converte `/c` em `C:/` nos argumentos
*2026-10-12*

- **O que aconteceu:** o `.mcp.json` saiu com `"C:/"` onde deveria haver `"/c"` (argumento do `cmd`), por causa da conversão de caminhos do MSYS.
- **Como evitar:** conferir o arquivo gerado; para argumentos assim, usar PowerShell ou editar o JSON direto.

## L14 — PowerShell 5.1 remove o `--` ao chamar executáveis
*2026-10-12*

- **O que aconteceu:** `claude mcp add ... -- cmd /c ...` falhou com "unknown option '-y'": o PowerShell engoliu o `--`.
- **Como evitar:** passar `'--'` entre aspas.

## L13 — Testar regra de senha pela API de cadastro gasta a cota de email
*2026-10-12 · spec 001*

- **O que aconteceu:** testar regras de senha via `POST /auth/v1/signup` esgotou o limite de envio do servidor de email padrão do Supabase e travou todo cadastro por cerca de 1 hora. O limite é checado antes da senha.
- **Como evitar:** regras de senha se testam nos testes unitários (`PasswordPolicy`) e no formulário, nunca pelo cadastro real.
- **Regra em:** [plano da spec 001 → Riscos](specs/001-autenticacao/plan.md#riscos-e-armadilhas).

## L12 — Estado medido a cada quadro no topo da árvore derruba o desempenho
*2026-10-12 · spec 003*

- **O que aconteceu:** os fios da página inicial são recalculados a cada quadro da inclinação com o mouse. O resultado ficava em `useState` no `Story`, que re-renderizava a página inteira a ~60 fps. Lighthouse no celular: 85–90.
- **Como foi resolvido:** o hook passou para dentro do `ConvergeWires`, o único componente que desenha os fios. Lighthouse: 93–96.
- **Como evitar:** estado que muda a cada quadro mora no componente que o desenha (ou vai direto para CSS vars/atributos do DOM), nunca num componente alto da árvore.
- **Regra em:** comentário em `web/src/features/landing/ConvergeWires.tsx`.

## L11 — Destaque que troca o fundo quebra o contraste medido
*2026-10-12 · spec 003*

- **O que aconteceu:** a linha destacada no iPhone ganhava fundo de card. No tema escuro, o vermelho da dívida sobre esse card caiu para 3,71:1 (Lighthouse).
- **Como evitar:** destacar com contorno e sombra, sem mudar o fundo, para os pares de texto continuarem os já medidos em `globals.css`. Se um estado trocar o fundo, remedir todos os textos que ficam em cima dele.
- **Regra em:** comentário de `.account-row[data-active]` em `web/src/styles/globals.css`.

## L10 — PR integrado antes de ter descrição e revisão
*2026-10-12 · PR #1*

- **O que aconteceu:** o PR #1 foi aberto pelo link do `git push` e integrado 18 s depois, com o título automático ("Chore/supabase sa east 1") e a descrição vazia. A descrição só foi escrita depois do merge.
- **Por que importa:** o PR é o registro do *porquê* de um conjunto de mudanças. Integrado sem descrição, o histórico fica só com o título automático.
- **Como evitar:** abrir o PR com `gh pr create` (título Conventional Commits + descrição completa) e só integrar depois de ler a descrição e conferir o checklist de testes.
- **Regra em:** [CLAUDE.md → Fluxo](../CLAUDE.md).

## L09 — Branch renomeada depois do merge
*2026-10-12*

- **O que aconteceu:** a branch `chore/supabase-sa-east-1` foi renomeada para `devpedro` depois de o PR #1 já estar integrado. O nome antigo ficou para sempre no commit de merge `3c3c76b`.
- **Como evitar:** decidir o nome da branch **antes** do primeiro push. A branch de trabalho é a `devpedro`.
- **Regra em:** [CLAUDE.md → Fluxo](../CLAUDE.md).

## L08 — Repositório do GitHub criado com README → históricos sem relação
*2026-10-12 · commit `de4bda8`*

- **O que aconteceu:** o repositório remoto foi criado pelo site com um "Initial commit" (README), enquanto o local já tinha 4 commits. O push foi recusado, e os históricos não tinham ancestral comum.
- **Como foi resolvido:** `git merge --allow-unrelated-histories`, mantendo o README do GitHub. **Sem `push --force`**, que teria apagado o commit remoto.
- **Como evitar:** ao criar repositório no GitHub para um projeto que já existe localmente, **não** marcar "Add a README".

## L07 — `gh auth login` interrompido no meio
*2026-10-12*

- **O que aconteceu:** o login parecia feito, mas o arquivo `%APPDATA%\GitHub CLI\hosts.yml` nem tinha sido criado. Faltava digitar o código de 8 caracteres em github.com/login/device e autorizar.
- **Como evitar:** o login só terminou quando o terminal mostra `✓ Logged in as pdfreitass`. Conferir com `gh auth status`.

## L06 — Chave secreta do Supabase colada no chat
*2026-10-12*

- **O que aconteceu:** a `sb_secret_…` foi colada duas vezes na conversa. Ela **ignora toda a RLS**: quem a tiver lê e apaga os dados de todos os usuários.
- **Como foi resolvido:** a chave foi apagada no painel (*Project Settings → API Keys*). O app não usa secret key, então nada quebrou.
- **Como evitar:** o app só precisa da **URL** e da **chave publicável**. Secret key nunca vai para chat, issue, commit ou variável `NEXT_PUBLIC_`.
- **Regra em:** [CLAUDE.md → Banco e segurança](../CLAUDE.md), [ARQUITETURA → Variáveis de ambiente](ARQUITETURA.md#variáveis-de-ambiente).

## L05 — Migrations coladas no SQL Editor, no projeto errado
*2026-10-12*

- **O que aconteceu:** as 4 migrations foram coladas e rodadas no SQL Editor do painel. Deram "Success", mas (a) no projeto de **us-west-2**, que ia ser substituído, e (b) sem registro no histórico de migrations do Supabase, o que faria um `db push` futuro tentar reaplicá-las e falhar.
- **Como evitar:** migrations **só** via `npx supabase db push`, com o projeto vinculado por `supabase link`. Antes, conferir o alvo com `npx supabase migration list`.
- **Regra em:** [CLAUDE.md → Banco e segurança](../CLAUDE.md), [ADR 0012](adr/0012-migrations-via-supabase-cli.md).

## L04 — Projeto Supabase criado na região errada
*2026-10-11 → 2026-10-12*

- **O que aconteceu:** o primeiro projeto (`yldlygsoponbvvyohcba`) foi criado em **us-west-2 (Oregon)**. O público é todo brasileiro, o que custa ~150–200 ms a mais por ida e volta ao banco.
- **Por que custou pouco:** foi percebido com o banco vazio. A região **não pode ser trocada** depois de criado o projeto; com dados, seria uma migração de verdade.
- **Como evitar:** ao criar qualquer recurso de infraestrutura (Supabase, Vercel, storage), escolher **São Paulo** (`sa-east-1` / `gru1`) e conferir a região antes de rodar a primeira migration (`npx supabase projects list`).
- **Regra em:** [ADR 0003](adr/0003-regiao-sa-east-1.md).

## L03 — Script npm com `$VAR` não roda no Windows
*2026-10-12 · commit `407d349`*

- **O que aconteceu:** `types:db` usava `--project-id $SUPABASE_PROJECT_ID`. No Windows o npm executa scripts via `cmd.exe`, que não expande `$VAR`. Além disso, a variável não estava definida em lugar nenhum.
- **Como evitar:** scripts do `package.json` sem sintaxe de shell específica. Preferir flags que leem configuração do projeto (`--linked`) ou um script Node.

## L02 — CLI do Supabase usado sem estar instalado
*2026-10-12 · commit `407d349`*

- **O que aconteceu:** o `types:db` chamava `supabase`, mas o CLI não estava instalado nem no projeto nem globalmente.
- **Como evitar:** ferramentas que os scripts usam entram como `devDependency`, com versão fixa no lockfile. Hoje: `supabase@^2.120.0`.

## L01 — Tabela criada sem `updated_at`
*2026-10-11 · migration `0001_init.sql`*

- **O que aconteceu:** `goal_contributions` foi criada sem `updated_at` e sem trigger, contrariando a regra do projeto. Só foi notado depois de a migration ser aplicada, então a correção exige uma `0005`.
- **Como evitar:** ao escrever uma migration com tabela nova, conferir a checklist: `user_id` + RLS + 4 policies + `created_at` + `updated_at` + trigger `set_updated_at`.
- **Pendência:** [ROADMAP → T1](ROADMAP.md#pendências-técnicas).

---

## Armadilhas conhecidas (evitadas desde o início)

Não chegaram a virar erro, mas estão aqui porque são fáceis de cometer neste stack.

| Armadilha | Consequência | Proteção atual |
|---|---|---|
| `new Date("2026-10-01")` | Em UTC-3 vira 30/09 às 21h | `parseDbDate` com `parseISO` |
| Dinheiro em `float` | `0.1 + 0.2 = 0.30000000000000004` | Centavos `bigint`, `parseCurrencyInput` só com dígitos |
| `sum()` do Postgres chega como string | Concatenação em vez de soma no JS | Cast `::bigint` nas views + `toCents()` |
| View sem `security_invoker` | Ignora a RLS e devolve dados de todos | `with (security_invoker = on)` nas 3 views |
| `auth.uid()` sem subquery na policy | Avaliado por linha, lento em tabela grande | `(select auth.uid())` |
| Client Supabase em variável de módulo no servidor | Sessão de um usuário vaza para outro | `createClient()` novo por request |
| `SECURITY DEFINER` sem `search_path` fixo | Função pode ser sequestrada | `set search_path = ''` |
| Verde vivo `#2ED38C` em texto no tema claro | Contraste 1,80:1 (reprova) | Token `--income` = `#1C7F54` no claro |
| `@supabase/auth-helpers-nextjs` | Pacote descontinuado | `@supabase/ssr` |
| Componente 21st.dev feito para Radix | Quebra com o shadcn atual (Base UI) | Revisar antes de colar |
