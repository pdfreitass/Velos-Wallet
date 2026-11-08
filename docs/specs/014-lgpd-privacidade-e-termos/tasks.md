# Tasks — Spec 014: LGPD, privacidade e termos

> Passos pequenos e verificáveis, a partir do [plan.md](plan.md).
> Uma task por vez. Ao terminar cada uma: parar, mostrar, e só então seguir.
> `dotnet build api`, `dotnet test api`, `typecheck`, `lint`, `test` e `build` do `web` passam
> antes de fechar qualquer task de código.

**A ordem não é arbitrária:** o texto só entra depois das operações que ele promete. Prometer o
que o código não faz é o erro que a RN2 existe para evitar.

## Do Pedro, em paralelo

### T0 — A caixa `privacidade@veloswallet.com.br`
Não é código, é DNS — e trava a **publicação**, não o desenvolvimento. O passo a passo está no
fim da [spec](spec.md). Resumo: criar a caixa (Zoho Mail tem plano grátis), criar o `MX` no
Registro.br em modo avançado, **não mexer** nos três registros do Resend, conferir em
`a.sec.dns.br` e mandar um email de teste de fora.

**Pronto quando:** um email mandado de fora chega na caixa.

---

## Banco

### T1 — Migration da exclusão de conta
`supabase/migrations/0014_excluir_conta.sql`

- A função `public.delete_my_account()` como está no plan: `security definer`,
  `set search_path = ''`, **sem parâmetro**, `delete from auth.users where id = (select auth.uid())`.
- `revoke all … from public, anon` e `grant execute … to authenticated`.
- Comentário na função explicando por que não aceita parâmetro.
- **Revisão `security` ANTES do `db push`.** É o único lugar do projeto que roda como `postgres`.
- `npx supabase db push --dry-run` → `npx supabase db push`.

**Pronto quando:** a função existe no banco, a revisão aprovou, e um teste manual com duas contas
de sonda prova que A apagando não encosta em B.

---

## API

### T2 — Editar o nome do perfil
`MeController` (`PUT`), `UpdateProfile.cs`, `ProfileStore`

- Validator: `NotEmpty`, `Trim`, 1–80 — **reusar o do cadastro**, não reescrever.
- Testes: nome válido grava; vazio e > 80 recusam com `validation_failed`; sem sessão, 401.

**Pronto quando:** `PUT /api/me` devolve 204 e o `GET` seguinte traz o nome novo.

---

### T3 — Exportar meus dados
`MeController` (`GET exportar`), `ExportMyData.cs`

- JSON com `perfil`, `contas`, `categorias`, `movimentacoes`, `metas`, `aportes`, mais um
  `_leia_me` dizendo que valor está em **centavos** e data em `"yyyy-MM-dd"`.
- CSV das movimentações: separador `;`, **BOM UTF-8**, valor em reais com vírgula.
- **Teste do escape**: descrição com `;`, com `"` e com quebra de linha. É onde CSV à mão quebra.
- Sem biblioteca nova.

**Pronto quando:** os dois formatos saem completos para uma conta de sonda com dado nos seis
tipos, e o CSV abre no **Excel de verdade** com acento certo.

---

### T4 — Encerrar a conta
`MeController` (`DELETE`), `DeleteMyAccount.cs`, `IAccountDeletionStore`, `AccountDeletionStore`

- Senha no **corpo**, nunca na URL. Limite por IP, como as demais rotas de auth.
- Confere a senha no GoTrue → chama `public.delete_my_account()` → limpa os cookies de sessão
  **e os quatro de fluxo**.
- Testes de Api: senha errada recusa sem apagar nada; sem sessão, 401; sucesso devolve 204 com
  os cookies expirados.

**Pronto quando:** a conta some, a sessão morre, e tentar entrar com o mesmo email diz que não
existe conta.

---

### T4-bis — Provar o caminho da conta só-Google
Sem código. É o teste que o plan.md exige **antes** de a tela ou a política prometerem qualquer
coisa a quem entra com Google.

1. Criar uma conta de sonda **por Google**.
2. Pedir recuperação de senha para ela e ver se o email chega e se a senha é criada.
3. Com a senha nova, encerrar a conta.

**Pronto quando:** está escrito aqui se o GoTrue aceita ou não — e, não aceitando, a RN4 e a
política passam a apontar o canal do titular para essas contas.

**Resultado:** _(a preencher)_

---

### T4-ter — Medir o que sobra depois de apagar
Sem código, mas **alimenta o texto da política**.

Depois da T4, conferir no banco se sobrou linha em `auth.refresh_tokens` (o `user_id` **não tem
FK**) e em `auth.audit_log_entries` (sem FK nenhuma, e com payloads que podem conter o email).

**Pronto quando:** está escrito aqui o que sobra e por quanto tempo — ou que não sobra nada.
Se sobrar, decidir: a função cresce, ou a política declara o registro técnico.

**Resultado:** _(a preencher)_

---

## Front

### T5 — Rotas públicas, casca e descoberta
`router.tsx`, `features/legal/LegalLayout.tsx`, `web/public/robots.txt`, `sitemap.xml`

- **Terceiro grupo de rotas, sem guarda** — nem `GuestOnly` (que redireciona quem está logado)
  nem `RequireAuth`. Só `/privacidade` e `/termos` ali dentro.
- `LegalLayout`: título, "última atualização", sumário navegável, voltar.
- Páginas ainda com o texto provisório; o conteúdo vem na T7/T8.
- Links no rodapé da landing, no `AuthLayout` e no menu do app.
- `robots.txt` e `sitemap.xml`.

**Pronto quando:** as duas rotas abrem **deslogado e logado**, em 375 px, nos dois temas — e o
`*` de "não encontrado" continua exigindo login.

---

### T6 — A tela `/perfil`
`pages/ProfilePage.tsx`, `features/profile/{NameForm,ExportData,DeleteAccountDialog}.tsx`, `api.ts`

- Nome editável, email só leitura.
- Exportar: os dois arquivos, com o que vai dentro escrito na tela.
- Encerrar conta: diálogo com **o que será apagado e o que fica**, senha, frase de confirmação.
  Operável por teclado.
- Conta sem senha: o caminho decidido na T4-bis.

**Pronto quando:** os três fluxos funcionam no navegador, em 375 px, nos dois temas, com os
estados de carregando, erro e sucesso.

---

## O texto

### T7 — Política de privacidade
`features/legal/sections/*.tsx`

Escrita a partir do levantamento da [spec](spec.md), cobrindo os **sete incisos do art. 9º**, um
a um, e com menção explícita ao art. 18 (inciso VII).

Precisa dizer, sem rodeio: o que guardamos · para quê e **com que base legal** · com quem
compartilhamos (Supabase, Fly.io, Resend, GitHub, Google) e onde cada um fica · **o backup como
transferência internacional** (art. 33) · quanto tempo as coisas duram · o que acontece ao
encerrar a conta, **incluindo o que não some no ato** (T4-ter) · os direitos e como exercê-los ·
quem é o controlador e o contato.

- **A lista de conferência do CA7** entra junto: cada afirmação com o arquivo e a linha que a
  sustentam. Sem ela a task não fecha.
- Falar do campo **descrição livre** e do dado sensível que entra por ali.

**Pronto quando:** a lista de conferência está completa e alguém que não escreveu o texto a leu.

---

### T8 — Termos de uso
`features/legal/sections/*.tsx`

Quem pode usar (**18 anos**, RN11) · o que o Velos é e o que **não** é (não é banco, não é
consultoria financeira, os números são os que a pessoa digita) · conta e segurança · o que
acontece ao encerrar · limitação de responsabilidade **que o CDC aceite** (art. 51 lista o que
não cola; art. 54, § 4º manda destacar o que limita direito) · mudanças nos termos · foro.

**Pronto quando:** lido contra os arts. 46, 51 e 54 do CDC, sem cláusula do rol do 51.

---

### T9 — Aviso no campo de descrição
`features/transactions/…`

Uma linha curta abaixo do campo, desencorajando dado desnecessário. Sem alarmar: quem usa o app
não quer uma aula de LGPD ao lançar um almoço.

**Pronto quando:** aparece no formulário, em 375 px, nos dois temas.

---

## Fecho

### T10 — ADR 0024
`docs/adr/0024-excluir-conta-de-usuario.md`

A função sem parâmetro e por quê · o `revoke`/`grant` e o `search_path` · a recusa do
`service_role` · **a reautenticação por senha e o que ela deixa de fora** · o resultado da
T4-bis · o que invalidaria a decisão.

### T11 — Bateria completa e revisões
Bateria inteira + E2E `readonly`. Revisão **`security`** (a função, o `DELETE`, as rotas
públicas) e **`qa`**. As páginas são visíveis na tela: **abrir no navegador** antes de dizer que
está feito.

### T12 — Google OAuth: publicar o app
Preencher os três campos do *Branding* (página inicial, privacidade, termos) e tirar o app do
modo **Testando** (CA8). Depende da T5 estar no ar.

### T13 — Documentação
ROADMAP (o L1 sai da lista), CHANGELOG, LICOES, spec 014 como Concluída. Conventional Commits e
PR conforme o fluxo.
