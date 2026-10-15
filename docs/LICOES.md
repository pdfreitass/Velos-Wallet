# Lições aprendidas

> Leia **antes de começar uma etapa** e sempre que algo "estranho" acontecer: é provável que já tenha acontecido antes.
> Ao terminar uma feature, acrescente aqui o que deu errado (ou quase) e como evitar. Lições mais recentes ficam no topo.

Formato de cada lição: **o que aconteceu → por que → como evitar → onde a regra mora agora**.

---

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
