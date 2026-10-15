# Brief e configuração para o Motion

Nada aqui foi executado: a conta está com **0 créditos** (`get_credit_balance`, plano `none`).

## 1. Anexos — como subir

`upload_asset` não lê caminho local. Para cada arquivo: pedir a URL assinada, subir os bytes e
guardar o `attachment_url` (válido por 7 dias) para o `create_video`.

Passo 1 — pedir a URL (uma chamada por arquivo):

```
upload_asset(filename: "03-home-app-contas-16x9-escuro.png", content_type: "image/png")
```

Passo 2 — subir os bytes com os campos devolvidos (o campo `file` vem por último, espera-se HTTP 204):

```bash
curl -s -o /dev/null -w "%{http_code}\n" -F "key=<upload_fields.key>" -F "policy=<...>" -F "file=@C:/Users/pedro/OneDrive/Área de Trabalho/Velos Wallet/media/video-lancamento/03-home-app-contas-16x9-escuro.png" "<upload_url>"
```

Arquivos a anexar, nesta ordem (8 de 100 permitidos):

| Ordem | Arquivo | Serve para |
|---|---|---|
| 1 | `03-home-app-contas-16x9-escuro.png` | Enquadramento-mãe: cor, tipografia e composição |
| 2 | `02-app-contas-escuro.png` | Tela 1 — Contas |
| 3 | `04-app-mes-escuro.png` | Tela 2 — Mês |
| 4 | `06-app-gastos-escuro.png` | Tela 3 — Gastos |
| 5 | `08-app-metas-escuro.png` | Tela 4 — Metas |
| 6 | `12-entrar-16x9-escuro.png` | Tela 5 — Entrar |
| 7 | `10-home-privacidade-claro.png` | Variante clara da identidade |
| 8 | `../../web/public/brand/velos-escuro.png` | Logotipo do fechamento |

## 2. Brief (campo `prompt`)

> Vídeo de lançamento do **Velos Wallet**, um app brasileiro de gestão financeira pessoal que
> funciona no navegador, sem loja de apps. Público: pessoas de 18 a 35 anos no Brasil, com renda
> fixa, que hoje se organizam de cabeça, num caderno ou numa planilha abandonada, e não sabem
> para onde o dinheiro vai. Tom: fintech premium, sóbria e confiante, sem euforia.
>
> O vídeo responde, nesta ordem, as três perguntas que o produto resolve: **quanto eu tenho
> agora**, **para onde meu dinheiro foi** e **quanto falta para a minha meta**. Depois mostra que
> é privado e que abre direto no navegador, e fecha na marca.
>
> Use as imagens anexadas como a interface real do produto — elas são o app, não inspiração.
> Mantenha os valores exatamente como aparecem nelas (R$ 10.650,45 de saldo total, +R$ 1.581,60
> que sobraram no mês, −R$ 2.618,40 de gastos em 5 categorias, metas em 62%, 21% e 20%) e
> preserve o selo "Exemplo": são valores ilustrativos.
>
> Textos na tela em português do Brasil, no máximo cinco palavras cada: "Seu dinheiro na direção
> certa.", "Todas as contas num lugar só", "Quanto entrou, quanto saiu", "Para onde o dinheiro
> foi", "E quanto falta para a sua meta", "Sem loja de apps. Privado por padrão." e, no fim,
> "Velos Wallet" com a chamada "Crie sua conta grátis".
>
> Movimento calmo e cinematográfico: a tela do aparelho desliza lateralmente entre as telas, as
> barras e o gráfico de rosca se desenham, os números contam para cima. Nada pisca nem gira.
>
> Não invente usuários, depoimentos, avaliações, número de downloads nem logotipo de parceiro: o
> produto ainda não lançou. Sem pessoas em stock footage, sem moedas ou cifrões em 3D, sem seta
> de bolsa subindo.

## 3. Chamada recomendada

```
create_video(
  prompt:        <o brief acima>,
  engine:        "motion",
  template:      "motion-app-launch",
  effort:        "medium",
  aspect_ratio:  "16:9",
  design_md:     <conteúdo de DESIGN-MOTION.md>,
  attachments:   [ {url: "<attachment_url 1>", type: "image", name: "..."}, ... ]
)
```

**Por que assim:**

- `template: "motion-app-launch"` — é o único dos quatro que tem a forma do roteiro (produto →
  toque no ícone → cinco telas → logo e chamada) e já nasce com 25,77 s em 1920×1080.
- `aspect_ratio: "16:9"` — combina com o template e com as capturas, todas feitas em 1920×1080.
  É a proporção certa para apresentar produto (site, YouTube, LinkedIn, pitch). O corte vertical
  para o Instagram @veloswallet sai depois, por `create_followup` com `aspect_ratio: "9:16"`,
  reaproveitando o projeto.
- `duration` **omitido** — o template já define o comprimento; passar o campo só briga com ele.
- `effort: "medium"` — é o padrão do engine. Com 0 créditos na conta, vale ver o primeiro
  resultado antes de pagar por `high`; se faltar refino, `create_followup` com `effort: "high"`.
- `design_system_id` **não usado** — nenhum dos presets (stripe, linear, vercel…) é o Velos, e
  `design_md` sobrescreveria qualquer um deles de todo jeito.

## 4. Créditos

O MCP **não tem** ferramenta de orçamento prévio: nenhuma estimativa sai sem iniciar a geração.
O que dá para afirmar com o que foi lido:

- Saldo atual: **0 créditos**, plano `none`.
- Preço: **US$ 6 por 200 créditos** (3¢ cada), compra mínima de 200, em múltiplos de 200.
- A documentação oficial do Motion diz que o custo "depende do engine, do esforço, da duração,
  da mídia gerada e das edições seguintes" — não publica tabela por segundo.
- Como referência externa (não oficial, de uma página concorrente): ~300 créditos por minuto
  finalizado, o que colocaria estes 26 s na casa de **~130 créditos**. Trate como ordem de
  grandeza, não como preço.

Conclusão prática: **um pacote de 200 créditos (US$ 6)** é o mínimo comprável e deve cobrir uma
geração em `medium`, com pouca folga para follow-ups. Para gerar, ajustar e ainda tirar o corte
9:16, **400 créditos (US$ 12)** é a aposta mais segura.
