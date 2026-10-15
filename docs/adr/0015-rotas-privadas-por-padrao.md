# ADR 0015 — Rotas privadas por padrão (API e front)

- **Status:** Aceita
- **Data:** 2026-10-15
- **Etapa:** Etapa 3 — Autenticação ([spec 001](../specs/001-autenticacao/spec.md), RN8)

## Contexto

Quase tudo no Velos é dado financeiro de uma pessoa. O erro mais provável não é um ataque sofisticado: é alguém criar um endpoint novo nas Etapas 4–7 e **esquecer** de marcá-lo como protegido. Num modelo "público, a não ser que se diga o contrário", esse esquecimento vira vazamento silencioso. Num modelo "privado, a não ser que se diga o contrário", o pior que acontece é uma tela pública que pede login e alguém percebe na hora.

## Decisão

**Na API**, tudo é privado por padrão. A `FallbackPolicy` (`RequireAuthenticatedUser`, em [`AuthenticationSetup.cs`](../../api/src/Velos.Api/Configuration/AuthenticationSetup.cs)) vale para todo endpoint sem atributo de autorização. Rota pública exige **`[AllowAnonymous]` explícito**, e cada uma tem de se justificar. Hoje são estas:

| Rota | Por que é pública |
|---|---|
| `GET /api/health` | Checagem de saúde do host, sem dados |
| `POST /api/auth/sign-up`, `sign-in` | Quem ainda não tem sessão precisa conseguir entrar |
| `POST /api/auth/sign-out` | Sair tem de funcionar até com a sessão já expirada (apaga os cookies de qualquer jeito) |
| `POST /api/auth/password-reset` | Esqueceu a senha = não tem sessão; a resposta é neutra (RN4) |
| `GET /api/auth/google` | Início do login com Google |
| `GET /auth/confirm`, `GET /auth/callback` | Volta do link de email e do Google; a sessão nasce aqui |
| *fallback* do SPA (`index.html`) | Só o HTML/JS do app; nenhum dado sai sem passar por `/api` |

Endereço desconhecido em `/api/*` sem sessão responde **401**, e não 404, para não revelar quais rotas existem.

**No front**, o roteador ([`router.tsx`](../../web/src/router.tsx)) põe toda rota que não está no grupo público (`GuestOnly`: `/`, `/entrar`, `/cadastro`, `/recuperar-senha`, `/auth/erro`) dentro de `RequireAuth`, **inclusive o `*`**. Endereço desconhecido sem sessão leva a `/entrar` e só vira 404 depois do login. O `RequireAuth` é **experiência do usuário**: quem protege os dados é a API.

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| `[Authorize]` em cada controller | Funciona até o dia em que alguém esquece um. O padrão seguro não pode depender de lembrar. |
| Proteger só no front | O front é do usuário: qualquer um chama `/api` direto. |
| 404 para rota desconhecida sem sessão | Permitiria mapear quais rotas existem sem estar logado. |
| `*` (404) fora do `RequireAuth` no front | Inofensivo para os dados, mas mostraria "página não encontrada" em vez de levar a quem não está logado para o login, que é o que a pessoa quase sempre quer. |

## Consequências

- **Positivas:** um endpoint esquecido nasce fechado. Revisar a superfície pública é procurar `[AllowAnonymous]`, e a lista é curta.
- **Negativas / riscos aceitos:** toda rota pública nova exige lembrar do atributo (é o atrito desejado). `/redefinir-senha` fica dentro do `RequireAuth` porque a volta do link já criou a sessão, e ainda exige o cookie de recuperação na API (CA7).
- **O que passa a ser regra:** já está no [CLAUDE.md](../../CLAUDE.md): "Toda rota da API é privada por padrão (`FallbackPolicy`); rota pública exige `[AllowAnonymous]` explícito". Rota pública nova entra na tabela acima e passa pelo agente `security`.

## Quando revisitar

- Se surgir um tipo de acesso que não é "usuário logado" (ex.: link público de compartilhamento, webhook de terceiro). Aí entram políticas nomeadas, mas o padrão continua fechado.
- Se a lista de `[AllowAnonymous]` crescer além do fluxo de autenticação: cada nova entrada precisa de revisão de segurança.
