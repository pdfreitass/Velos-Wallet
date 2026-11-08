# ADR 0023 — Confirmação de email: três desfechos na volta do link

- **Status:** Aceita
- **Data:** 2026-11-07
- **Etapa:** Etapa 3 — Autenticação ([spec 013](../specs/013-confirmacao-de-email/spec.md), RN9)

## Contexto

A volta do link de confirmação (`GET /auth/confirmar-cadastro`) nasceu com **dois** desfechos, no
molde da redefinição de senha: ou a troca PKCE cria a sessão e a pessoa cai em `/painel` logada, ou
falha e ela vai para `/entrar?erro=confirmacao`, que diz *"Este link não é mais válido. Peça outro."*

O verificador do PKCE vive num cookie `httpOnly` do navegador onde a pessoa se **cadastrou**. Ou
seja: quem se cadastra no celular e abre o email no computador — **o caminho mais comum** — nunca
tem o verificador na volta. A troca falha sempre, e a tela mandava pedir outro link.

Dois detalhes transformam isso num beco sem saída, e não só numa mensagem feia:

1. **O GoTrue consome o token do email no `/verify`, antes de redirecionar.** Quando a pessoa
   chega à nossa rota, o email **já está confirmado**. Faltava só a sessão.
2. **Cada link novo repete exatamente o mesmo ciclo**, porque o verificador continua no outro
   navegador. Pedir outro link nunca resolve. A conta está confirmada, a senha funciona, e a
   única coisa que faltava era alguém dizer "é só entrar".

## Decisão

**Três desfechos, não dois.** Na volta do link:

| Situação | Para onde | O que a pessoa lê |
|---|---|---|
| O GoTrue devolveu `error`/`error_code` | `/entrar?erro=confirmacao` | "Este link não é mais válido. Peça outro." |
| Tem `code` e **não** tem verificador | `/entrar?aviso=confirmado` | "Seu email foi confirmado. É só entrar." |
| Tem `code` e tem verificador | `/painel`, já logado (ou o erro acima, se a troca for recusada) | — |

O erro declarado é lido **primeiro**, e manda mesmo que venha um `code` junto: a rota nunca afirma
"foi confirmado" por inferência quando o próprio GoTrue disse o contrário.

**O verificador só é consumido quando há `code`.** Apagá-lo em toda visita deixaria qualquer página
de terceiros matar um cadastro em andamento com um `<img src=".../auth/confirmar-cadastro">` — o
cookie é `SameSite=Lax`, então a navegação de imagem o levaria junto. Sem `code`, nada foi gasto do
lado do GoTrue, então não há o que consumir aqui.

**Cookie que chega e não desprotege é logado.** Adulterado, de outro fluxo ([RN6](../specs/013-confirmacao-de-email/spec.md)) ou vencido, o
desfecho é o mesmo de não ter cookie — mas é tentativa de ataque, e sem o log não deixaria rastro.

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| **Manter dois desfechos** | É o beco sem saída descrito acima: quem confirmou não consegue entrar e não tem como saber disso. |
| **Guardar o verificador no servidor, por email** | Resolveria de vez, mas vira estado novo no banco (tabela, limpeza, expiração) e amplia a superfície do fluxo de auth para ganhar um redirect. Caro demais para o problema. |
| **Confirmar sem PKCE, lendo `token_hash`** | É o desenho antigo, que a spec 013 substituiu de propósito: PKCE é o que impede que um link interceptado valha sozinho. |
| **Distinguir pelo banco** (`email_confirmed_at` preenchido e `last_sign_in_at` nulo) | É a assinatura certa do caso — foi assim que o diagnóstico foi feito — mas exigiria consultar uma conta a partir de uma rota anônima, só para escolher um texto. Cria exatamente o oráculo de enumeração que a RN4 evita. |

## Consequências

- **Positivas:** o caminho mais comum do fluxo deixa de ser um ciclo infinito. A mensagem passa a
  dizer o que a pessoa deve fazer, e não o que a API não conseguiu fazer. O ramo novo é mais barato
  que o antigo: não chama o Supabase.
- **Riscos aceitos:** quem montar `?code=qualquer-coisa` à mão vê "Seu email foi confirmado".
  Aceito, com os olhos abertos: o ramo **não** consulta conta nenhuma (sem oráculo de email), não
  chama o Supabase, não cria sessão, não grava cookie e devolve uma resposta constante, igual para
  todo mundo. O que sobra é ajudar um phishing a parecer crível — num domínio que o atacante não
  controla, numa tela que não captura nada. Trocar "um estranho pode se auto-enganar" por "quem
  confirmou não consegue entrar" é a troca certa.
- **O que passa a ser regra:** em fluxo PKCE que volta de um email, **"não consegui criar a sessão"
  não é "o link não valeu"**. Listar os casos que caem no mesmo desfecho de erro antes de escrever
  a mensagem ([L46](../LICOES.md)).

## Quando revisitar

- **Se o GoTrue passar a devolver `code` junto com `error`** — a leitura do erro vem primeiro, então
  o desenho aguenta; mas a premissa merece ser reconferida.
- **Se o GoTrue passar a devolver `code` sem ter validado o token** (um `flow_state` que não
  confirmou), aí sim o aviso mentiria, e o caso teria de voltar a ser "link inválido".
- **Se aparecer exclusão de conta de usuário**, vale reavaliar se o ramo deve continuar mudo sobre
  a conta.
