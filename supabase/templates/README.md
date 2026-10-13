# Modelos de email

Modelos da spec [001 — Autenticação](../../docs/specs/001-autenticacao/spec.md) (RN13, CA16).
O Supabase **não** lê esta pasta: ela é a fonte versionada. Quem publica é o painel, colando o
HTML na mão (passo **C3** do [plan.md](../../docs/specs/001-autenticacao/plan.md)).

| Arquivo | Modelo no painel | Assunto | Situação |
|---|---|---|---|
| [`recovery.html`](recovery.html) | *Reset Password* | `Redefinição de senha — Velos Wallet` | **ativo** |
| [`confirmation.html`](confirmation.html) | *Confirm signup* | `Confirme seu cadastro no Velos Wallet` | guardado, **não ativar** |

O de confirmação fica escrito e parado: a confirmação de email está desligada (Revisão 1 da
spec, passo C1) e só volta com o Resend + domínio próprio, antes do deploy.

## Por que o link não usa `{{ .ConfirmationURL }}`

O modelo padrão do Supabase entrega o token no **`#fragmento`** da URL, que o navegador nunca
envia ao servidor — e quem precisa dele aqui é a API. Por isso os dois modelos montam o
endereço à mão:

```
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery
```

Trocar isso pelo padrão **quebra a recuperação de senha** (T19).

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

## C3 — publicar o modelo de redefinição ⛔ adiado

**Não dá para fazer hoje.** O painel bloqueia a edição com o aviso *"Set up custom SMTP to edit
templates — Emails will be sent using the default templates"*: enquanto o envio for pelo servidor
embutido do Supabase (o "para experimentar", com limite por hora), assunto e corpo ficam travados
nos modelos padrão, em inglês e sem logo.

Decisão de 2026-10-13 (P3 da [spec](../../docs/specs/001-autenticacao/spec.md)): **publicar junto
com o Resend + domínio próprio**, que já era pré-requisito do deploy. Até lá os modelos ficam aqui,
versionados e prontos.

Quando o SMTP próprio existir:

1. Supabase → **Authentication** → **Emails** → aba **Reset password**.
2. *Subject*: `Redefinição de senha — Velos Wallet`.
3. *Body*: apagar o conteúdo e colar o `recovery.html` **inteiro**, do `<!DOCTYPE` ao `</html>`.
4. **Save**.

Não mexer nas outras abas: só a de redefinição entra.

> A recuperação de senha (T19) **não** depende disto. Ela usa PKCE: o link do modelo padrão volta
> para o app com `?code=` na query, que o servidor lê e troca por sessão — válido por 5 minutos e de
> uso único, como a RN6 pede. O `token_hash` dos modelos daqui é o caminho de quando eles entrarem.

## C6 — enviar a logo para o bucket

Os emails apontam para uma URL pública, porque Gmail e Outlook não exibem SVG nem imagem em
base64 de forma confiável:

```
https://khvottmyspapwsdeqqnm.supabase.co/storage/v1/object/public/brand/velos-claro.png
```

O bucket `brand` já existe (migration [`0006_storage_brand.sql`](../migrations/0006_storage_brand.sql)),
mas **o arquivo ainda não foi enviado** — conferido em 2026-10-13: a URL acima responde
`404 NoSuchKey`. Enquanto isso, o email chega sem a logo (fica o texto "Velos Wallet", que é
justamente a rede de proteção para quem bloqueia imagens).

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
