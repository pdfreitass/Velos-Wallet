# ADR 0014 — Bloqueio de tentativas de login na API, com falha fechada

- **Status:** Aceita
- **Data:** 2026-10-15
- **Etapa:** Etapa 3 — Autenticação ([spec 001](../specs/001-autenticacao/spec.md), RN5)

## Contexto

A RN5 pede que 5 senhas erradas seguidas para o mesmo email bloqueiem o login desse email por 10 minutos, com aviso a partir da 3ª tentativa. Três restrições moldam a solução:

- **Não revelar contas (RN4):** o bloqueio tem de acontecer igual para um email que não tem conta. Senão, "fui bloqueado" vira um jeito de descobrir quem é cliente.
- **O Supabase Auth não faz isso:** ele tem limite de requisições por IP, mas não conta erros por email nem bloqueia por tempo.
- **Desde o [ADR 0013](0013-api-aspnet-e-front-react-vite.md), o navegador só fala com a API:** quem chama o Supabase é a API, e a chave publicável não vai para o front.

## Decisão

O bloqueio mora **no banco**, e quem o aplica é **a API, antes de chamar o Supabase**.

- **Banco** ([`0005_login_attempts.sql`](../../supabase/migrations/0005_login_attempts.sql)): a tabela `login_attempts` guarda só o **sha256 do email normalizado**, nunca o email. Ela não tem policies e ninguém a lê diretamente: o acesso é só pelas funções `login_lock_status`, `register_login_failure` e `clear_my_login_failures`. A última apaga **apenas** o registro do email de quem está logado, para que ninguém consiga desbloquear o email de outra pessoa.
- **Regra** (`LoginLockoutPolicy` no Domain, espelho da migration): 5 falhas → 10 min; aviso da 3ª à 5ª tentativa; falhas com mais de 1 dia deixam de contar como "seguidas".
- **Fluxo** (`SignInHandler` na Application): consultar o bloqueio → se bloqueado, recusar **sem chamar o Supabase** (mesmo com a senha certa) → tentar o login → se a senha estiver errada, registrar a falha → se o login der certo, zerar a contagem. Redefinir a senha (T19) também zera.
- **Falha fechada:** se a API não conseguir consultar ou registrar o bloqueio (banco fora do ar), o login **não acontece** e a resposta é `503 lockout_unavailable`. Preferimos alguém sem conseguir entrar por alguns minutos a um bloqueio que some exatamente quando o banco está instável.

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| Contar as tentativas no navegador (`localStorage`) | Basta limpar o navegador ou usar outro para zerar. Não protege nada. |
| Bloquear por IP | Quem tenta senhas troca de IP com facilidade, e um IP compartilhado (rede da empresa, 4G) bloquearia pessoas que não erraram nada. O limite por IP do Supabase continua valendo, por cima. |
| Bloquear só emails que têm conta | Revelaria quais emails estão cadastrados (viola a RN4). |
| Guardar o email em texto | Não precisamos dele para contar; o hash basta e reduz o que vaza se a tabela for exposta. |
| Falha aberta (deixar logar se o bloqueio estiver indisponível) | Quem ataca só precisaria provocar instabilidade para ter tentativas ilimitadas. |
| Bloquear a conta até ação do suporte | O MVP não tem suporte; o prazo de 10 min resolve sozinho, e "Esqueci minha senha" libera antes. |

## Consequências

- **Positivas:** o formulário não consegue contornar o bloqueio (CA-seg). Ele vale para qualquer email (CA15). Nenhum email é guardado. A regra está em um lugar só no C#, com testes, e o banco é a fonte da contagem.
- **Negativas / riscos aceitos:**
  - **O endpoint de login do Supabase continua público.** Quem descobrir a chave publicável pode chamar `/auth/v1/token` direto e passar por fora do bloqueio, sujeito só ao limite por IP do Supabase. Isso já é melhor que o plano original, porque o navegador nem recebe a chave. Mas a chave publicável **não é secreta por natureza**, então o bloqueio dificulta, não impede.
  - **Bloquear o email de outra pessoa é possível**: basta errar a senha dela 5 vezes. É inerente a todo bloqueio por email. O dano é limitado: 10 minutos, e a pessoa ainda pode redefinir a senha.
  - **Banco fora do ar = ninguém entra.** É o preço da falha fechada.
- **O que passa a ser regra:** nenhum login por senha sem passar pelo `SignInHandler`. Se surgir outro caminho de login por senha, ele aplica o mesmo bloqueio.

## Quando revisitar

- Se o Supabase passar a oferecer bloqueio por email ou CAPTCHA no endpoint de senha (aí o bloqueio pode ir para lá e fechar o desvio pela chave publicável).
- Se aparecerem bloqueios de má-fé em volume (alguém travando emails de terceiros), considerar CAPTCHA a partir da 3ª tentativa.
- Antes do deploy: conferir os limites por IP do Supabase Auth no painel.
