# Guia — ligar o "Continuar com Google"

Passos **C4** e **C5** do [plan.md](plan.md). O código da T20 já está pronto; sem esta configuração o
botão leva a uma tela de erro do Supabase dizendo que o provedor não está habilitado.

São dois painéis, nesta ordem: primeiro o Google (para ter as credenciais), depois o Supabase (para
guardá-las). **O Client Secret não pode entrar em commit, chat ou arquivo do projeto** — ele vai
direto do Google Cloud Console para o painel do Supabase.

## C4 — criar o cliente OAuth no Google

1. Abra <https://console.cloud.google.com/> e crie um projeto (ou escolha um existente). O nome é
   interno, só você vê.
2. **APIs e serviços → Tela de permissão OAuth** (*OAuth consent screen*):
   - Tipo: **Externo**.
   - Nome do app: `Velos Wallet`. Email de suporte e email do desenvolvedor: o seu.
   - Em *Público-alvo*, enquanto estiver em **Teste**, só contas adicionadas como **usuários de
     teste** conseguem entrar — inclua o email que você vai usar para testar, senão o login falha
     com "acesso bloqueado".
3. **APIs e serviços → Credenciais → Criar credenciais → ID do cliente OAuth**:
   - Tipo de aplicativo: **Aplicativo da Web**.
   - Nome: `Velos Wallet (web)`.
   - **URIs de redirecionamento autorizados** → adicionar exatamente:

     ```
     https://khvottmyspapwsdeqqnm.supabase.co/auth/v1/callback
     ```

     É o endereço do **Supabase**, não o do app. Quem fala com o Google é o Supabase; o app só
     recebe o usuário de volta depois.
4. Copie o **Client ID** e o **Client Secret** que aparecem ao salvar.

## C5 — guardar as credenciais no Supabase

1. Abra <https://supabase.com/dashboard/project/khvottmyspapwsdeqqnm/auth/providers>.
2. Abra **Google** e ligue o provedor.
3. Cole **Client ID** e **Client Secret**. **Save**.

Confira que as *Redirect URLs* do projeto já incluem `http://localhost:3000/**` (passo C2, feito):
é para onde o app pede para voltar depois do Google.

## Como testar (CA6 e CA9)

Com a API e o front no ar:

1. Em `/entrar`, clique em **Continuar com Google** e escolha a conta.
   Você deve voltar logado em `/painel`, e o nome do perfil deve ser o **nome da conta Google** (RN9).
2. Repita: a segunda vez entra na **mesma conta**, sem criar outra (RN10, RN11).
3. **Cancele** na tela do Google: tem que cair em `/auth/erro?motivo=google`, com a saída para entrar.
4. **CA9**: abra `/entrar?next=https://site-malicioso.com` e entre com o Google. Tem que terminar em
   `/painel`, nunca no site externo — o `next` é validado na ida e de novo na volta.

## Quando mudar de domínio

No deploy, acrescente nos dois lugares:

- **Google Cloud Console**: o URI de redirecionamento continua sendo o do Supabase, então **não muda**.
- **Supabase → URL Configuration**: *Site URL* e *Redirect URLs* do domínio novo.
- **Tela de permissão OAuth**: publicar o app (sair de *Teste*) para aceitar qualquer conta Google.
