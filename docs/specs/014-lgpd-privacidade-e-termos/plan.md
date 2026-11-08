# Plano técnico — Spec 014: LGPD, privacidade e termos

> **COMO** implementar a [spec.md](spec.md), aprovada em 2026-11-08.
> Conferido contra [ARQUITETURA.md](../../ARQUITETURA.md), [LICOES.md](../../LICOES.md) e as [ADRs](../../adr/).

## Resumo da abordagem

Três frentes que quase não se tocam, e por isso podem ser feitas em ordem:

1. **Duas páginas públicas** (`/privacidade`, `/termos`) — só front, nenhuma linha de API. É o
   que destrava o Google OAuth.
2. **Três operações no `/api/me`** — editar nome, exportar e encerrar conta. A terceira é a
   única difícil, e tem ADR próprio.
3. **O texto**, escrito a partir do levantamento da spec e conferido linha a linha contra o
   código (CA7).

A ordem importa: **o texto depende do que o código faz**, então as operações novas entram
antes do texto que as promete. Prometer e não cumprir é o erro que a RN2 existe para evitar.

## Banco de dados

- **Migration nova:** `supabase/migrations/0014_excluir_conta.sql`
- Nenhuma tabela, coluna ou view nova. Nada muda no modelo de dados.
- O que entra é **uma função**:

```sql
create or replace function public.delete_my_account()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from auth.users where id = (select auth.uid());
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
```

Por que assim, e não de outro jeito:

- **`security definer`** porque `auth.users` não é do usuário — quem executa precisa do poder do
  dono da função (`postgres`), não do `authenticated`.
- **`where id = (select auth.uid())`** é a trava inteira: a função **não aceita parâmetro**.
  Sem id de entrada, não existe "apagar o usuário X" — só "apagar quem está chamando". É o que
  mantém a regra do projeto de a API nunca ganhar poder sobre terceiros.
- **`set search_path = ''`** e nomes qualificados: sem isso, um schema no caminho poderia
  sequestrar o `auth.users` dentro de uma função que roda como `postgres`.
- **`revoke … from public, anon`**: só `authenticated` executa. Sem sessão, nem chega perto.

O resto vem de graça: das **16 FKs** que apontam para `auth.users`, **15 são `on delete cascade`**
(conferido no banco em 2026-11-08), então profile, contas, categorias, movimentações, metas e
aportes caem junto — e também `auth.identities`, `auth.sessions` e `auth.one_time_tokens`. A
décima sexta é `auth.scim_users`, que é `set null` e o projeto não usa.

> ⚠️ **Dois lugares para conferir depois de apagar, não antes:** `auth.refresh_tokens.user_id`
> **não tem FK** (só o `session_id` tem), e `auth.audit_log_entries` não tem FK nenhuma e guarda
> payloads do GoTrue que podem conter o email. Se sobrar linha, ou a função cresce para limpar, ou
> a política diz que existe um registro técnico de autenticação com prazo próprio. **Medir antes
> de escrever a cláusula** — é exatamente o tipo de frase que a RN2 proíbe chutar.

Depois: `npx supabase db push --dry-run` → `npx supabase db push`. Não precisa de `types:db`:
nenhum tipo do banco mudou.

## Arquivos

### API

| Ação | Caminho | Responsabilidade |
|---|---|---|
| alterar | `api/src/Velos.Api/Controllers/MeController.cs` | ganha `PUT` (nome), `GET export` e `DELETE` |
| criar | `api/src/Velos.Application/Profiles/UpdateProfile.cs` | comando + validator (nome 1–80, `Trim`) + handler |
| criar | `api/src/Velos.Application/Profiles/ExportMyData.cs` | monta o pacote de exportação a partir dos stores |
| criar | `api/src/Velos.Application/Profiles/DeleteMyAccount.cs` | orquestra: confere a reautenticação, chama o store, limpa a sessão |
| criar | `api/src/Velos.Application/Abstractions/IAccountDeletionStore.cs` | contrato de uma operação: `DeleteMyAccountAsync` |
| criar | `api/src/Velos.Infrastructure/Persistence/AccountDeletionStore.cs` | `select public.delete_my_account()` dentro da sessão do usuário |
| alterar | `api/src/Velos.Infrastructure/Persistence/ProfileStore.cs` | `update profiles set name = …` |

### Front

| Ação | Caminho | Responsabilidade |
|---|---|---|
| alterar | `web/src/router.tsx` | grupo de rotas **sem guarda** para `/privacidade` e `/termos` |
| criar | `web/src/pages/PrivacyPage.tsx` · `TermsPage.tsx` | as duas páginas |
| criar | `web/src/features/legal/LegalLayout.tsx` | casca comum: título, "última atualização", sumário, voltar |
| criar | `web/src/features/legal/sections/*.tsx` | o texto, quebrado por seção (nenhum arquivo > ~150 linhas) |
| criar | `web/src/pages/ProfilePage.tsx` | `/perfil`: nome, exportar, encerrar conta |
| criar | `web/src/features/profile/NameForm.tsx` · `ExportData.tsx` · `DeleteAccountDialog.tsx` | um por operação |
| alterar | `web/src/features/profile/api.ts` *(novo)* | `updateName`, `exportData`, `deleteAccount` |
| alterar | rodapé da landing + `AuthLayout` + menu do `AppLayout` | links para as duas páginas |
| criar | `web/public/robots.txt` · `web/public/sitemap.xml` | as páginas precisam ser alcançáveis pelo Google |

### Rotas públicas, com cuidado

Hoje o router tem **dois** grupos: `GuestOnly` (que **redireciona quem está logado** para o
painel) e `RequireAuth`. **Nenhum dos dois serve** para páginas legais: quem está logado também
tem de poder ler a política. Entra um terceiro grupo, irmão dos outros, **sem elemento de
guarda** — as duas rotas ficam ali, e mais nada.

O `MapFallbackToFile("index.html").AllowAnonymous()` do `Program.cs` já serve essas URLs sem
sessão, então abrir `/privacidade` direto na barra funciona. O `*` (não encontrado) continua
dentro do `RequireAuth`, como está hoje: isto **não** afrouxa o "privado por padrão".

## Fluxo de dados

```
Editar nome      PUT  /api/me            → UpdateProfileHandler → ProfileStore (update)       → 204
Exportar         GET  /api/me/exportar   → ExportMyDataHandler  → stores (leitura)            → 200 arquivo
Encerrar conta   DELETE /api/me          → DeleteMyAccountHandler
                                           ├─ confere a senha no GoTrue
                                           ├─ AccountDeletionStore → select public.delete_my_account()
                                           └─ SessionCookies.Clear + AuthFlowCookies.ClearAll  → 204
```

Toda leitura e escrita continua passando pelo `UserDbSession` (role `authenticated` + claims do
JWT), como manda o CLAUDE.md. A função nova é chamada **dentro** dessa transação — é de lá que
sai o `auth.uid()`.

## Provar que é a pessoa antes de apagar — **decidido: senha**

**Decisão do Pedro, 2026-11-08: caminho A — senha no corpo do `DELETE`.** O handler confere a
senha contra o GoTrue (mesma chamada do login) antes de chamar a função. Sem ticket novo, sem
cookie novo, sem propósito novo: é a peça mais simples que resolve o caso comum.

### O que isso deixa de fora, e o que fazemos com isso

**Quem entrou com Google nunca criou senha.** Para essas contas, o `DELETE` com senha não tem o
que conferir. Em vez de deixar essas pessoas sem caminho — o que proibiria a política de
prometer a exclusão (RN2) —, a saída é **mandá-las criar uma senha**, com o fluxo que já existe:

```
/perfil → "Encerrar conta" → a conta não tem senha?
        → "Você entra com o Google e ainda não tem senha. Crie uma para encerrar a conta."
        → /recuperar-senha (link por email) → /redefinir-senha → volta e encerra
```

Nada novo: é o fluxo de recuperação já validado de ponta a ponta em 2026-11-02 (T9 da spec 001).
A pessoa continua a conseguir encerrar sozinha — só com um passo a mais.

> ⚠️ **Duas coisas a provar antes de escrever isto na tela ou na política** — e nenhuma está
> provada hoje:
> 1. **O GoTrue aceita `/recover` para uma conta criada só por Google?** É plausível (o email
>    está confirmado), mas plausível não é verificado, e este projeto já foi mordido por
>    suposição sobre o GoTrue. Testar com uma conta de sonda criada por Google.
> 2. **Como a API sabe que a conta não tem senha?** O `auth.identities` diz o provedor, mas a API
>    não lê o schema `auth`. O mais simples é não adivinhar: tentar apagar, e **se o GoTrue
>    recusar a senha**, a tela mostra o caminho do Google. Decidir na task, depois do teste 1.

Se o teste 1 falhar, a política **não** promete exclusão por autoatendimento para contas Google:
promete pelo canal do titular, em até 15 dias (art. 19, II) — e o ADR 0024 registra o porquê.

**O caminho B (ticket de reautenticação, no molde do `velos_pw_reset`) fica registrado como a
evolução natural**, se o passo a mais incomodar.

## Exportação: formato e tamanho

Dois arquivos, a mesma consulta (RN5):

- **JSON** — um objeto com `perfil`, `contas`, `categorias`, `movimentacoes`, `metas`,
  `aportes`. Datas em `"yyyy-MM-dd"`, **valores em centavos**, como no resto do projeto, com um
  campo `_leia_me` explicando isso em português. É o que serve à portabilidade (art. 18, V).
- **CSV das movimentações** — o que a pessoa abre no Excel. **Separador `;`** e **BOM UTF-8**,
  senão o Excel em português quebra acento e junta tudo numa coluna. Valor em reais com vírgula
  (`1.234,56`), porque aqui quem lê é humano, não máquina.

Sem biblioteca nova: `System.Text.Json` e um `StringBuilder`. O volume é pequeno (a maior conta
hoje tem 28 movimentações), então **tudo em memória, numa resposta só** — nada de streaming.

> Escapar o CSV à mão é onde isso costuma dar errado: campo com `;`, com aspas ou com quebra de
> linha (a **descrição** é texto livre!) vai entre aspas, com as aspas internas duplicadas.
> Teste com uma descrição maldosa é obrigatório.

## Validação

- **Nome:** `NotEmpty`, `Trim`, 1–80 caracteres, mensagem em pt-BR. É o mesmo limite do cadastro
  — conferir no validator existente e **reusar**, não reescrever.
- **Encerrar conta:** a frase de confirmação é checada no **front** (é experiência); o que o
  servidor exige é a **senha**. Nunca o contrário. A senha vai no corpo do `DELETE`, nunca na
  URL — e a rota entra no limite por IP, como as demais de auth.
- O banco garante o resto: as FKs em cascata, e a função que não aceita parâmetro.

## Dependências novas

**Nenhuma.** JSON e CSV saem da biblioteca padrão; as páginas são TSX com o texto dentro, sem
renderizador de Markdown.

> O texto legal em `.tsx` em vez de `.md` é escolha consciente: um renderizador de Markdown é uma
> dependência nova para ganhar pouco, e o CLAUDE.md exige justificar antes de instalar.

## Decisões

- **[ADR 0024] — Excluir conta de usuário por função `security definer`.** Merece ADR porque é a
  primeira vez que a API alcança o schema `auth`, e porque a alternativa (dar `service_role` à
  API) é proibida por regra. O ADR registra: a função sem parâmetro, o `revoke`/`grant`, o
  `search_path`, e o que invalidaria a decisão.
- **Reautenticação: senha** (caminho A), decidido em 2026-11-08. O ADR 0024 registra a escolha,
  o que ela deixa de fora (contas só-Google) e a saída por "criar uma senha primeiro".
- O [ADR 0017](../../adr/0017-excluir-conta-apaga-movimentacoes.md) **não é tocado**: ele é sobre
  conta **bancária**. Pergunta 2 da spec.

## Riscos e armadilhas

- **A função roda como `postgres`.** É o único lugar do projeto com esse poder. Revisão
  `security` obrigatória antes do `db push`, e o teste de que `delete_my_account()` chamada por A
  não encosta em B.
- **Migration é arquivo novo**, nunca editar aplicada, nunca colar SQL no editor do Supabase.
- **Não dá para desfazer.** O teste de ponta a ponta usa conta de sonda, nunca a conta real do
  Pedro — e a conta de sonda do E2E (`E2E_EMAIL`) também não, senão a sonda para de funcionar.
- **Depois de apagar, a sessão tem de morrer** em todos os aparelhos: limpar os cookies de
  sessão e os quatro de fluxo. Um cookie sobrevivente aponta para um usuário que não existe.
- **O CSV e o Excel** (acima). E a descrição é texto livre do usuário.
- **A política não pode prometer o que o código não faz** (RN2). O CA7 exige a lista de
  conferência: cada afirmação do texto com o arquivo e a linha que a sustentam. Essa lista entra
  neste `plan.md` quando o texto for escrito.
- **`robots.txt` e `sitemap.xml`**: hoje não existem. Sem eles o Google acha as páginas na mesma,
  mas o `sitemap` ajuda, e o `robots` evita que alguém depois bloqueie o site inteiro sem perceber.

## Como testar

**Por critério de aceite da spec:**

- **CA1** — abrir `/privacidade` e `/termos` deslogado, em 375 px, nos dois temas; e **logado**,
  para provar que o grupo novo não redireciona.
- **CA2** — ler o texto com o art. 9º ao lado, inciso a inciso.
- **CA3** — mudar o nome, recarregar, ver no app.
- **CA4** — exportar e conferir **linha a linha contra o banco** (`select` no Supabase); abrir o
  CSV no Excel de verdade, com acento e com uma descrição que tenha `;` e aspas.
- **CA5/CA6** — duas contas de sonda. A primeira encerra; conferir no banco que **nenhuma** linha
  dela sobrou nas seis tabelas, que a segunda está intacta, e que entrar com o email apagado diz
  que não existe conta. Conferir também `auth.refresh_tokens` e `auth.audit_log_entries`.
- **CA7** — a lista de conferência, revisada por alguém que não escreveu o texto.
- **CA8** — preencher o *Branding* do Google e tentar publicar.
- **CA-seg** — revisão `security` da função e do `DELETE`; provar que não há como passar id de
  outro usuário.

**Bateria:** `dotnet build api`, `dotnet test api`, `typecheck`, `lint`, `test`, `build` do `web`
e o E2E `readonly`. Testes novos: validator do nome, handler de exportação (incluindo o escape do
CSV), handler de exclusão, e os de Api para as três rotas.

> E o aviso que mais vale neste projeto: **teste verde não é funcionar**. As páginas são visíveis
> na tela — abrir no navegador antes de dizer que está feito.
