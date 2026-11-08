# Spec 013 — Confirmação de email no cadastro

> **O QUE** fazer e **como saber que está pronto.** O detalhe técnico vai no [plan.md](plan.md).

- **Etapa do roadmap:** Etapa 3 — Autenticação (Revisão 1 da [spec 001](../001-autenticacao/spec.md), passo **C1**)
- **Status:** **Entregue** (2026-11-07) · no ar e provada contra a produção. Uma pendência nomeada: rodar o E2E `probe` com a conta de sonda (T6)
- **Data:** 2026-11-03 · entregue em 2026-11-07

## Problema

Hoje o cadastro cria a conta **sem confirmar o email**: qualquer pessoa se cadastra com o endereço de outra, e a vítima só descobre quando tenta entrar e o email "já está em uso". É o bloqueador nº 3 da lista "antes de divulgar".

O email de redefinição de senha já é bonito (logo, cartão, botão em verde profundo) e já chega em português — o modelo de confirmação **já existe como gêmeo dele** em `supabase/templates/confirmation.html`, mas nunca foi publicado porque o fluxo não existe. Não é ligar um interruptor: o link do modelo atual monta `token_hash`, que a API não lê, e a rota `/auth/confirm` de hoje é a da redefinição de senha.

## Histórias de usuário

- Como **usuário novo**, quero confirmar meu email com um clique no link que recebi, para ativar minha conta e já entrar.
- Como **usuário novo que perdeu o email**, quero pedir o link de novo, para não ficar preso do lado de fora.
- Como **usuário que tenta entrar antes de confirmar**, quero uma mensagem clara do que falta e um botão para reenviar, para resolver sem adivinhar.

## Escopo

### Dentro
- Ligar a confirmação de email no cadastro (painel do Supabase: *Confirm email* + publicar o modelo — passos do Pedro, como foi o C3).
- Fluxo PKCE igual ao da redefinição: o cadastro gera o par código/verificador, o link do email volta com `?code=`, e a API troca pelo código usando o verificador guardado em cookie.
- **Rota nova** para a volta do link (não reutiliza `/auth/confirm`, que é da redefinição e lê o verificador dela).
- Tela pós-cadastro: "Enviamos um link para o seu email", com o endereço digitado visível, aviso de spam e **botão de reenviar**.
- Login antes de confirmar: mensagem clara + caminho para reenviar.
- Link inválido, expirado ou reaberto: tela/estado amigável com caminho para reenviar.
- **O E2E `probe` deixa de cadastrar**: passa a entrar com uma conta de teste **já confirmada**, fornecida por variáveis de ambiente (nunca no repo). O `readonly` não muda.

### Fora (explicitamente)
- Trocar o email de uma conta.
- Excluir cadastros não confirmados (limpeza automática ou manual).
- Convites e magic links.
- Confirmação no login com Google (o próprio Google já confirma; nada muda nesse fluxo).
- Métricas de entrega de email (abertura, bounce) além do que o Supabase já mostra.

## Regras de negócio

- **RN1 — Sem confirmar, não entra.** O cadastro não cria sessão; o login de um email não confirmado é recusado com mensagem clara e caminho para reenviar.
- **RN2 — O link vale uma vez e expira.** O código do Supabase segue o prazo padrão (1 hora) e só pode ser trocado uma vez. Reenviar gera um link novo; o anterior morre.
- **RN3 — Quem clica já volta logado.** Confirmado com sucesso, a sessão é criada e a pessoa vai para `/painel`.
- **RN4 — Reenvio com resposta neutra.** Como na recuperação de senha, a resposta não revela se o email tem cadastro. **Única exceção: serviço fora do ar**, porque mentir "enviamos" com o serviço fora é pior.
  > O limite de envios do Supabase **não** é exceção, ao contrário do que esta regra dizia até 2026-11-07: o `SMTP_MAX_FREQUENCY` do GoTrue é **por usuário**, então devolvê-lo diria "este email tem cadastro aqui" — um oráculo binário, justo o que a RN4 existe para impedir. Quem freia abuso é a política por IP da API, que não olha o email (achado da revisão `security`).
- **RN5 — Contas existentes não mudam.** Quem já confirmou (incluindo todas as contas criadas até hoje, que o Supabase trata como confirmadas) entra normalmente e não recebe email nenhum.
- **RN6 — O verificador vive só em cookie httpOnly**, protegido com Data Protection, com **propósito próprio** (um verificador do cadastro não pode ser usado no fluxo de redefinição, e vice-versa) e é consumido uma única vez.
- **RN7 — Limite por IP** nas rotas novas. A volta do link fica no limite geral de auth (10/min); o **reenvio tem política própria, 3 a cada 15 minutos**, igual à da recuperação de senha, porque cada chamada gasta cota de email — com 10/min dava para encher a caixa de uma vítima e, pior, esgotar a cota de envio do projeto, derrubando cadastro **e** recuperação.
- **RN9 — Confirmado em outro navegador não é link inválido.** Quando a volta traz código mas não o verificador (cadastro no celular, email aberto no computador — o caminho comum), o email **já foi confirmado** pelo GoTrue: a tela de entrar diz isso e convida a entrar, em vez de mandar pedir outro link, que só repetiria o ciclo. Sem verificador não há sessão: a pessoa entra com a senha.
  A rota **lê o `error`/`error_code` que o GoTrue manda na volta** e trata erro declarado primeiro,
  mesmo que venha um `code` junto: o aviso nunca se apoia só na ausência de erro. Decisão e riscos
  no [ADR 0023](../../adr/0023-confirmacao-de-email-tres-desfechos.md).
- **RN8 — Email já em uso** mantém o comportamento de hoje: "email em uso" com caminho para entrar.

## Telas e estados

| Tela | Rota | Estados obrigatórios | Observações |
|---|---|---|---|
| Cadastro — sucesso | `/cadastro` (estado de sucesso na própria página) | enviando (botão ocupado) · sucesso · erro | Mostra o email digitado, "confira a caixa de entrada e o spam", botão "Reenviar email" com feedback e limite por IP visível quando atingido |
| Volta do link | `/auth/confirmar-cadastro` (redirecionamento do servidor, sem tela) | — | Sucesso: `/painel` já logado. Confirmado sem verificador (RN9): `/entrar?aviso=confirmado`. Link inválido: `/entrar?erro=confirmacao` |
| Entrar — confirmado em outro navegador | `/entrar?aviso=confirmado` | aviso (`role="status"`, não é erro) | Mensagem: "Seu email foi confirmado. É só entrar." |
| Entrar — link inválido | `/entrar?erro=confirmacao` | alerta + caminho para reenviar | Mensagem: "Este link não é mais válido. Peça outro." |
| Entrar — email não confirmado | `/entrar` (erro do formulário) | mensagem clara + ação | "Confirme seu email antes de entrar" + botão que pede outro link |

Em **375 px**, nos dois temas. Textos em **português do Brasil**, com acento. Estados anunciados com `role="status"`/`role="alert"` (CA-a11y).

## Critérios de aceite

> Marcado só o que tem prova. O que foi conferido traz **onde** e **quando**; o resto continua aberto, de propósito.

- [x] **CA1** — Dado um cadastro novo, quando envio o formulário, então **não entro** no app, vejo a tela "confira seu email", e o email chega na **caixa de entrada**, em português, com a logo e o botão verde — o mesmo visual do email de redefinição de senha. *(Pedro, contra a produção, 2026-11-07, com um alias do Gmail.)*
- [x] **CA2** — Quando clico no link do email, então volto para `/auth/confirmar-cadastro`, a troca do código cria a sessão e eu caio em `/painel` **logado**. *(Mesma prova do CA1.)*
- [ ] **CA3** — Quando reabro o link já usado, então **não** ganho sessão e vejo "Este link não é mais válido", com caminho para pedir outro. *(Coberto por teste de Api; não conferido à mão depois da RN9.)*
- [x] **CA4** — Quando abro o link em outro navegador (sem o cookie do verificador), então **não** ganho sessão, mas vejo "Seu email foi confirmado. É só entrar." — e não "peça outro link" (RN9). *(Tela conferida no navegador em 375 px, nos dois temas, 2026-11-07; o redirect da API, por teste. O caminho real, de ponta a ponta, não foi refeito.)*
- [ ] **CA5** — Quando tento entrar com um email ainda não confirmado, então vejo "Confirme seu email antes de entrar" e um botão para reenviar; o reenvio dispara um email novo, e o link antigo deixa de valer (RN2).
- [ ] **CA6** — Dado um usuário com conta já confirmada (incluindo as antigas), quando entra, então entra normalmente e **não recebe email nenhum**.
- [ ] **CA7** — Dado um cadastro com email já em uso, então o comportamento atual se mantém: "email em uso" com caminho para entrar (RN8).
- [x] **CA-seg** — O verificador fica só em cookie httpOnly protegido (nunca no front); os fluxos de cadastro e redefinição têm cookies/propósitos separados; o reenvio responde de forma neutra (RN4/RN6); as rotas novas têm limite por IP (RN7). *(Revisão `security`, 2026-11-07.)*
- [ ] **CA-a11y** — A tela de sucesso do cadastro e os estados de reenvio funcionam em 375 px, nos dois temas, e as mudanças são anunciadas a leitores de tela. *(O aviso novo da tela de entrar foi conferido; a tela de sucesso do cadastro e o reenvio, não.)*
- [ ] **CA-build** — `dotnet build api`, `dotnet test api`, `typecheck`, `lint`, `test` e `build` do `web`, e o E2E `readonly` passam; o E2E `probe` passa com a conta confirmada por variáveis de ambiente. *(Tudo verde menos dois: `dotnet test api` tem 24 falhas de integração por `Tests:UserId` apagado ([L48](../../LICOES.md)), e o `probe` não rodou.)*

## Perguntas em aberto

- [ ] **Prazo de 1 hora é o certo?** É o padrão do Supabase e o mesmo da redefinição. Calibrar com uso real, se alguém reclamar.
- [ ] **Reenviar sem limite por sessão?** Hoje o limite é por IP (RN7). Se os envios pesarem, o próximo passo é um limite por email/sessão.
