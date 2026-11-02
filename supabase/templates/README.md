# Modelos de email

Modelos da spec [001 — Autenticação](../../docs/specs/001-autenticacao/spec.md) (RN13, CA16).
O Supabase **não** lê esta pasta: ela é a fonte versionada. Quem publica é o painel, colando o
HTML na mão (passo **C3** do [plan.md](../../docs/specs/001-autenticacao/plan.md)).

| Arquivo | Modelo no painel | Assunto | Situação |
|---|---|---|---|
| [`recovery.html`](recovery.html) | *Reset password* | `Redefinição de senha — Velos Wallet` | **publicado em 2026-11-02** |
| [`confirmation.html`](confirmation.html) | *Confirm signup* | `Confirme seu cadastro no Velos Wallet` | guardado, **não ativar** |

O de confirmação fica escrito e parado: a confirmação de email está desligada (Revisão 1 da
spec, passo C1) e só volta com o Resend + domínio próprio, antes do deploy.

## O link do `recovery.html` (corrigido em 2026-11-01)

Hoje o modelo usa **`{{ .ConfirmationURL }}`**. Este texto explica por que ele já não monta o
endereço à mão, porque a explicação anterior ficou obsoleta e virou uma armadilha.

**O que dizia antes:** que o padrão do Supabase entrega o token no `#fragmento` da URL, que o
navegador nunca manda ao servidor, e por isso o modelo tinha de montar
`{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery` à mão — trocar isso
quebraria a recuperação (T19).

**Por que isso deixou de valer:** aquilo descrevia o fluxo **implícito**. A recuperação passou a
usar **PKCE** (`SupabaseAuthClient.RequestPasswordReset` manda `code_challenge` e
`code_challenge_method`), e no PKCE o Supabase devolve o código em **`?code=` na query**, não no
fragmento. O `redirect_to` enviado é `/auth/confirm` (`AuthController`), então o
`{{ .ConfirmationURL }}` chega como `https://<domínio>/auth/confirm?code=...`.

**E o modelo à mão estava quebrado:** ele mandava `token_hash`, e o
`AuthCallbackController.Confirm` lê **só** `[FromQuery] string? code`. O `token_hash` era ignorado,
o `code` chegava vazio e todo link caía no `/recuperar-senha?erro=link`.

> **Ainda não foi testado de ponta a ponta** (pendência T9): o servidor de email padrão do Supabase
> não permite. Confirmar no primeiro teste real com o Resend, pedindo o link, abrindo, trocando a
> senha e conferindo que o link não funciona de novo.

### E o `confirmation.html`?

Continua montando o endereço à mão com `token_hash`, e **não foi mexido**: o fluxo de confirmação de
cadastro está desligado e nunca foi implementado com PKCE, então não dá para afirmar que o
`{{ .ConfirmationURL }}` serve lá. Rever junto com o passo C1, quando a confirmação de email voltar.

> Cuidado ao comentar os modelos: o Supabase processa as variáveis **até dentro de comentário
> HTML**, e todo comentário viaja junto no email enviado. Por isso os cabeçalhos dos dois
> arquivos são curtos e a explicação mora aqui.

## Cores e contrastes

Layout de email tradicional: tabelas, CSS embutido, nada de flexbox, grid ou variáveis CSS.
As cores vêm dos tokens do tema claro em [`globals.css`](../../web/src/styles/globals.css).

A RN13 escreveu o fundo como `#F4F7F2`; esse token desceu para `#ECF1EA` na spec 003 (o claro
tinha ficado "branco demais" perto do verde), e os modelos seguem o valor atual. O PNG da logo
tem `#F4F7F2` embutido — a um passo de 1/255 por canal do cartão `#F5F8F3`, então a imagem funde
no cartão sem emenda visível.

| Par | Medido | Onde |
|---|---|---|
| `#0A2E24` sobre `#F5F8F3` | 13,72:1 | texto no cartão |
| `#0A2E24` sobre `#ECF1EA` | 12,83:1 | texto no fundo |
| `#576E66` sobre `#F5F8F3` | 5,12:1 | texto de apoio no cartão |
| `#576E66` sobre `#ECF1EA` | 4,79:1 | rodapé |
| `#F4F7F2` sobre `#0A2E24` | 13,60:1 | texto do botão |
| `#197A50` sobre `#F5F8F3` | 4,97:1 | link por extenso |

Todos ≥ 4,5:1 (WCAG 2.1). Ao mexer numa cor, **remedir**. O botão principal é verde profundo
(a marca), nunca o verde vivo.

## C3 — publicar o modelo de redefinição ✅ feito em 2026-11-02

Publicado assim que o Resend passou a enviar pelo domínio próprio, o que destravou a edição no
painel (antes ele avisava *"Set up custom SMTP to edit templates"* e mantinha o modelo padrão, em
inglês e sem logo).

O que foi feito, em **Authentication → Emails → Reset password**:

1. *Subject*: `Redefinição de senha — Velos Wallet`
2. *Body*: o `recovery.html` inteiro, do `<!DOCTYPE` ao `</html>`
3. **Save changes**

Conferido no mesmo dia com um email de verdade no Gmail: assunto em português, logo no topo,
botão em verde profundo, link do PKCE correto, e o preheader a aparecer ao lado do assunto.

> **O painel é que manda, não este arquivo.** O Supabase não lê esta pasta. Toda mudança aqui tem
> de ser colada lá outra vez — e todo comentário do HTML viaja dentro do email.

### E as outras abas?

**Nenhuma outra foi publicada**, e não é esquecimento:

| Aba do painel | Por quê |
|---|---|
| *Confirm signup* | A confirmação de email está **desligada** (Revisão 1 da spec, passo C1). Ver abaixo |
| *Invite user*, *Magic link*, *Change email*, *Reauthentication* | O app **não usa** nenhum destes fluxos |

### ⚠️ O `confirmation.html` está quebrado — não publicar

Ele aponta para `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup`, e isso
falha por **duas** razões independentes:

1. O `AuthCallbackController.Confirm` lê **só** `[FromQuery] string? code`. O `token_hash` é
   ignorado, o `code` chega vazio, e o link cai em `/recuperar-senha?erro=link` — exatamente o bug
   que o `recovery.html` teve até 2026-11-01.
2. Mais fundo: o `/auth/confirm` **é a rota da redefinição de senha**, não da confirmação de
   cadastro. Ele lê o `resetVerifier` do cookie e, no sucesso, manda para `/redefinir-senha`. Não
   existe hoje rota nenhuma que confirme um cadastro.

Ou seja: **não basta trocar o link do modelo.** O passo **C1** tem de implementar o fluxo primeiro
(rota própria, PKCE, para onde o usuário vai depois de confirmar) e só então o modelo se ajusta ao
que for construído. Por isso ele fica aqui, versionado e parado.

## C6 — enviar a logo para o bucket ✅ feito

Os emails apontam para uma URL pública, porque Gmail e Outlook não exibem SVG nem imagem em
base64 de forma confiável:

```
https://khvottmyspapwsdeqqnm.supabase.co/storage/v1/object/public/brand/velos-claro.png
```

O bucket `brand` já existe (migration [`0006_storage_brand.sql`](../migrations/0006_storage_brand.sql)),
e **o arquivo já está lá** — conferido em 2026-11-02: a URL acima responde `200` com 26 KB, e a
logo aparece no email recebido no Gmail. O texto "Velos Wallet" logo abaixo continua a ser a rede
de proteção para quem bloqueia imagens.

Se um dia for preciso reenviar:

1. Supabase → **Storage** → bucket **`brand`**.
2. **Upload file** → [`web/public/brand/velos-claro.png`](../../web/public/brand/velos-claro.png)
   (1080×1080, 25,6 KB — abaixo do limite de 1 MB do bucket).
3. O nome tem que ficar **`velos-claro.png`**, na raiz do bucket, senão a URL muda.
4. Conferir: abrir a URL acima numa aba anônima e ver a imagem.

O upload é pelo painel de propósito: a migration não cria policy nenhuma em `storage.objects`,
então ninguém pelo app consegue enviar, trocar ou apagar arquivo deste bucket.

## Conferir antes de publicar

`npm run preview:emails --prefix web` monta os dois modelos com valores de exemplo no lugar das
variáveis e escreve em `web/.preview-emails/` — serve para abrir no navegador e ver o resultado.
É só pré-visualização: **o teste que vale é o CA16**, com o email de verdade no Gmail (web e
celular) e no Outlook.

## Limite do servidor de email

Até existir Resend + domínio próprio, quem envia é o servidor padrão do Supabase, que só entrega
para **membros do projeto** e com limite baixo por hora. Testar com o email do Pedro.
