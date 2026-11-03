# ADR 0020 — Fly.io `gru` como host

- **Status:** Aceita
- **Data:** 2026-11-02
- **Etapa:** Pré-deploy

## Contexto

O [ADR 0013](0013-api-aspnet-e-front-react-vite.md) decidiu a stack — API ASP.NET servindo o build do Vite **na mesma origem** — e deixou o host em aberto, com dois candidatos: **Azure *Brazil South*** e **Fly.io `gru`**. Ambos ficam em São Paulo, como a regra do `CLAUDE.md` exige para infraestrutura nova.

Esse buraco virou **o nó do pré-deploy**: sem host não há endereço para apontar o `veloswallet.com.br`, não há valor para o `App__PublicOrigin`, e o OAuth do Google não sai do modo *Teste* (o *Branding* exige página inicial, política de privacidade e termos, que precisam do domínio no ar).

O que o app precisa do host é pouco e específico: **um processo**, que serve a API e os arquivos estáticos do SPA, falando com o Supabase em `sa-east-1`. Sem fila, sem worker, sem armazenamento próprio (a logo mora no Storage do Supabase), sem banco gerenciado. O uso inicial é de **uma pessoa** — o Pedro, que quer lançar para uso próprio antes de divulgar.

## Decisão

Hospedar a aplicação no **Fly.io, região `gru` (São Paulo)**, como **uma única máquina** rodando um container com a API e o SPA.

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| Azure *App Service*, Brazil South | Faz o mesmo trabalho com muito mais cerimônia à volta: resource group, App Service Plan, configuração de deploy. O proveito disso — escala gerenciada, integração com o resto do Azure — não aparece num app de um processo e um usuário. Fica como saída se o projeto crescer |
| Vercel | **Não roda .NET.** Já está ligada ao repositório e gera preview a cada PR, mas o preview é só o front, sem API, e não loga. É uma pendência à parte: decidir se desliga |
| Azure Container Apps | Mais perto do que queremos que o App Service, mas ainda traz Container Apps Environment e Log Analytics atrás; complexidade sem retorno nesta fase |
| Dois serviços (API e front separados) | Contraria o [ADR 0013](0013-api-aspnet-e-front-react-vite.md): a mesma origem é o que permite a sessão em cookie `httpOnly` sem CORS |

## Consequências

- **Positivas:** o deploy é um `Dockerfile` e um `fly deploy`; `gru` deixa o app perto do Supabase em `sa-east-1` e dos usuários; a máquina única é barata e cabe no uso previsto; sair do Fly depois é mudar de host, não de arquitetura, porque o que define o app é o container.
- **Negativas / riscos aceitos:**
  - **Uma máquina é um ponto único de falha.** Aceito: o app ainda não tem usuários além do dono. Escalar é `fly scale count 2`, mas aí as **chaves do Data Protection passam a ter de ser compartilhadas** entre as instâncias, não só persistidas.
  - O Fly pode **parar a máquina por inatividade** (`auto_stop_machines`). O primeiro acesso depois disso paga o arranque a frio. Com `min_machines_running = 1` isso não acontece, ao custo de deixá-la sempre de pé.
  - O volume das chaves do Data Protection é **local à máquina**: se ela for destruída e recriada sem o volume, todo mundo é deslogado.
- **O que passa a ser regra:** infraestrutura nova continua em São Paulo. O deploy é por container, e **nada de segredo em `appsettings*.json`** — tudo por `fly secrets`.

## Quando revisitar

Se o app passar a ter usuários de verdade e uma máquina deixar de bastar; se aparecer necessidade de serviços gerenciados que o Fly não dá bem (fila, cron com garantia, blob storage); ou se o custo do Fly deixar de compensar.
