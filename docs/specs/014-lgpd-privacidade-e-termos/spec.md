# Spec 014 — LGPD: privacidade, termos e controle da própria conta

> **O QUE** fazer e **como saber que está pronto.** O detalhe técnico vai no [plan.md](plan.md).

- **Etapa do roadmap:** item **L1** da [auditoria](../../audit/08-implementation-roadmap.md) · pré-divulgação
- **Status:** **Aprovada** (Pedro, 2026-11-08) · aguardando o `plan.md`
- **Data:** 2026-11-08
- **Decisões do Pedro (2026-11-08):** o **controlador é pessoa física** (Pedro Freitas, em nome próprio) · o canal do titular é uma **caixa no próprio domínio**.

## Problema

O Velos guarda a vida financeira de pessoas físicas no Brasil e **não tem política de privacidade
nem termos de uso**. Três consequências, hoje:

1. **Legal.** A LGPD exige informar ao titular, de forma clara e acessível, o que é feito com os
   dados dele (art. 6º, VI e art. 9º). Hoje não há onde ler isso.
2. **Produto.** Dos direitos do art. 18, **três não têm caminho nenhum** no app: corrigir o nome
   do perfil, levar os dados embora (portabilidade) e encerrar a conta. Quem pedir, hoje, depende
   de alguém mexer no banco à mão.
3. **Crescimento.** O botão **"Publicar app"** do Google OAuth está travado por três campos
   vazios no *Branding*: página inicial, política de privacidade e termos de serviço. Enquanto
   não publicar, **só os test users entram com Google** — e o contador está em 0. Isso já custou
   um cadastro real: em 07/11 às 22:38 alguém se cadastrou por email e não confirmou; um minuto
   depois entrou pelo Google com outro endereço.

Liga ao objetivo da [VISAO](../../VISAO.md) de ser um app em que a pessoa **confia** para colocar
o próprio dinheiro.

## O que o app faz com dado, hoje

Levantado em 2026-11-08 lendo o schema e o código — não é suposição.

### Dados que o Velos guarda

| Onde | O quê |
|---|---|
| `auth.users` (Supabase) | email, senha com hash, data de confirmação, último login; **se entrar com Google**, o id e o perfil básico que o Google devolve (`openid`, `email`, `profile`) |
| `profiles` | **nome** e moeda |
| `accounts` | apelido da conta, tipo, saldo inicial |
| `transactions` | valor, data, tipo, categoria e **descrição livre** |
| `categories` | nome, cor, ícone |
| `goals`, `goal_contributions` | nome da meta, alvo, prazo, aportes |
| `login_attempts` | **hash** do email, contagem de erros, até quando está bloqueado |

**Não há CPF, endereço, telefone, nem conexão com banco ou Open Finance.** O app nunca vê extrato
real: tudo é digitado pela pessoa.

> ⚠️ **A descrição livre da movimentação é o ponto sensível.** Ninguém pede dado de saúde, mas
> "consulta psiquiatra", "remédio", "advogado do divórcio" são o tipo de coisa que uma pessoa
> escreve ali — e isso é **dado sensível** (art. 11) chegando por um campo que não foi desenhado
> para ele. A política tem de dizer o que acontece com esse campo, e o produto não deve
> incentivar a escrever mais do que precisa.

### O que sai do Velos

| Para quem | O quê | Onde fica |
|---|---|---|
| **Supabase** | banco e autenticação | São Paulo (`sa-east-1`) |
| **Fly.io** | hospedagem da API e do site | São Paulo (`gru`) |
| **Resend** | emails de confirmação e de redefinição de senha (só o endereço e o link) | São Paulo (`sa-east-1`) |
| **Google** | **só se a pessoa escolher** "Continuar com Google" | fora do Brasil |
| **GitHub Actions** | **o backup diário do banco inteiro**, cifrado com GPG (AES256) | **fora do Brasil** |

**O navegador não fala com mais ninguém.** Conferido no código: `connect-src 'self'` e
`font-src 'self'` na CSP, nenhum script externo no `index.html`, **zero analytics, zero pixel,
zero fonte do Google**. Isso sustenta a faixa "Privado por padrão" da página inicial — e é raro o
bastante para merecer um parágrafo próprio na política.

No navegador ficam só: os cookies `httpOnly` da sessão (`velos_at`, `velos_rt`) e os de fluxo
(`velos_pkce`, `velos_signup`, `velos_oauth`, `velos_pw_reset`), o tema escolhido e dois ids da
última conta/categoria usada, no `localStorage`. **Nenhum cookie de rastreio.**

> ⚠️ **O backup é uma transferência internacional** (art. 33). O artefato tem `public` **e**
> `auth`, cifrado, e o GitHub guarda por 90 dias (padrão do `upload-artifact`). Está protegido,
> mas **precisa aparecer na política** e merece uma decisão: continuar assim e declarar, ou mudar
> o destino para o Brasil.

## Histórias de usuário

- Como **visitante**, quero ler o que o app faz com meus dados **antes** de me cadastrar, para
  decidir se confio.
- Como **usuário**, quero **corrigir meu nome**, porque digitei errado no cadastro.
- Como **usuário**, quero **baixar tudo o que é meu** num arquivo, para guardar ou levar para
  outro app.
- Como **usuário**, quero **encerrar minha conta e apagar meus dados**, sem pedir a ninguém.
- Como **usuário**, quero saber **com quem o Velos compartilha** meus dados e por quê.

## Escopo

### Dentro

- **Página pública `/privacidade`** — política de privacidade.
- **Página pública `/termos`** — termos de uso.
- **Editar o nome do perfil.**
- **Exportar meus dados** num arquivo que a pessoa baixa (contas, categorias, movimentações,
  metas e aportes, mais o nome e o email).
- **Encerrar a conta**, com confirmação forte, apagando os dados pessoais.
- **Canal do titular**: **`privacidade@veloswallet.com.br`**, publicado nas duas páginas, para os
  pedidos do art. 18 que o app não resolve sozinho (ver a pré-condição, no fim).
- Links para as duas páginas no rodapé da página inicial, nas telas de cadastro/entrar e dentro
  do app.
- Aviso curto no campo de **descrição** da movimentação, desencorajando dado desnecessário.

### Fora (explicitamente)

- **Banner de cookies.** Não há cookie de rastreio nem analytics; os cookies existentes são
  estritamente necessários para a sessão. Pedir consentimento para eles seria teatro.
- **Consentimento granular por finalidade.** Enquanto o app não fizer marketing nem analytics,
  não há o que consentir além do próprio uso do serviço.
- **Relatório de impacto (RIPD) formal** — art. 38, só se a ANPD pedir.
- **Encarregado (DPO) com estrutura própria** — o Pedro assume o papel e publica um contato.
- Trocar o destino do backup, mudar retenção de log na infraestrutura, ou sair do GitHub. Entra
  como **pergunta em aberto**, não como tarefa.

## Regras de negócio

- **RN1 — Cada finalidade tem uma base legal escrita.** Fazer o app funcionar (guardar contas,
  movimentações e metas, autenticar, enviar email de confirmação e de senha) é **execução de
  contrato** (art. 7º, V) — **não** consentimento. Segurança (bloqueio de tentativas, limite por
  IP, logs de erro) é **legítimo interesse** (art. 7º, IX). O login com Google é escolha da
  pessoa: ali há **consentimento** (art. 7º, I), e dá para usar o app inteiro sem ele.
- **RN2 — O que a política promete, o código cumpre.** Nenhuma frase entra sem alguém ter
  conferido no código que é verdade. Prometer apagar o que não se apaga é pior do que não ter
  política.
- **RN3 — Encerrar a conta apaga de verdade.** Sai o usuário do `auth.users`; as FKs já são
  `on delete cascade`, então profile, contas, categorias, movimentações, metas e aportes vão
  junto. O que **não** é apagado no ato tem de estar escrito: o `login_attempts` guarda só um
  **hash** do email (não identifica sozinho) e expira; o **backup cifrado** dos últimos 90 dias
  ainda contém o registro, e isso é exatamente o caso do art. 16 ("limites técnicos das
  atividades"). A tela diz isso antes de confirmar, sem letra miúda.
- **RN4 — Encerrar exige prova de que é a pessoa.** Digitar a senha (ou refazer o Google) e
  confirmar por escrito. Sessão encerrada no ato, em todos os aparelhos.
- **RN5 — Exportar é legível e completo.** Dois arquivos que abrem sem o Velos: **JSON** com tudo
  (fiel, serve à portabilidade do art. 18, V) e **CSV das movimentações** (que é o que a pessoa
  abre no Excel). Serve também ao art. 18, II (acesso).
- **RN6 — Prazo de resposta.** Pedido pelo canal do titular responde em até **15 dias**
  (art. 19, II). O que o app resolve sozinho é imediato.
- **RN7 — A política diz com quem se compartilha** (art. 18, VII): Supabase, Fly.io, Resend,
  GitHub (backup) e Google (se escolhido), **cada um com para quê e onde fica**.
- **RN8 — Em português do Brasil, para ser lida.** Frases curtas, sem "outrossim", sem parede de
  texto jurídico. A lei pede informação **clara e acessível** (art. 6º, VI).
- **RN9 — Versão e data.** As duas páginas trazem "última atualização" e o que mudou. Mudança
  relevante avisa quem já tem conta.
- **RN10 — As páginas são públicas e indexáveis**, e abrem sem sessão. O Google exige URL pública
  para publicar o app.
- **RN11 — O Velos é para maiores de 18 anos.** Está nos termos. O app lida com dinheiro e é
  contrato de adesão; tratar dado de criança e adolescente traria a regra própria do art. 14,
  inclusive consentimento de um dos pais, que o produto não tem como cumprir hoje.
- **RN12 — O controlador é pessoa física.** A política nomeia o Pedro e publica o contato
  (art. 9º, III e IV); **CPF não entra**. O mesmo contato vale como o do encarregado
  (art. 41, § 1º).

## Telas e estados

| Tela | Rota | Estados obrigatórios | Observações |
|---|---|---|---|
| Política de privacidade | `/privacidade` | estático | Pública. Sumário navegável; legível em 375 px |
| Termos de uso | `/termos` | estático | Pública. Mesmo molde |
| Meu perfil | `/perfil` | loading · erro · salvando · sucesso | Nome editável, email só leitura, e as duas ações abaixo |
| Exportar meus dados | em `/perfil` | ocioso · preparando · baixado · erro | Baixa um arquivo; diz o que vai dentro |
| Encerrar conta | em `/perfil` → diálogo | confirmação forte · processando · erro | Lista o que será apagado e o que fica; exige senha + confirmação escrita |

Em **375 px**, nos dois temas. Textos em **português do Brasil**, com acento. Estados anunciados
com `role="status"` / `role="alert"`.

## Critérios de aceite

- [ ] **CA1** — Dado que estou deslogado, quando abro `/privacidade` e `/termos`, então as páginas
      carregam, sem sessão, e o conteúdo é legível em 375 px nos dois temas.
- [ ] **CA2** — Quando leio a política, encontro **os sete incisos do art. 9º**, um a um:
      finalidade específica (I), forma e duração do tratamento (II), identificação do controlador
      (III), contato do controlador (IV), uso compartilhado e sua finalidade (V),
      responsabilidades dos agentes (VI) e os direitos do titular **com menção explícita ao
      art. 18** (VII). A base legal de cada finalidade também está lá — não é exigência do art. 9º,
      mas é o que torna o texto conferível.
- [ ] **CA3** — Quando corrijo meu nome no perfil e recarrego, o nome novo aparece no app.
- [ ] **CA4** — Quando exporto meus dados, baixo um arquivo que abre fora do Velos e contém minhas
      contas, categorias, movimentações, metas e aportes — conferido contra o banco, linha a linha.
- [ ] **CA5** — Quando encerro minha conta, confirmando como a tela pede, então sou deslogado, e
      **nenhuma linha minha sobra** em `profiles`, `accounts`, `categories`, `transactions`,
      `goals` e `goal_contributions`. Tentar entrar com o mesmo email depois diz que não existe
      conta.
- [ ] **CA6** — Quando encerro minha conta, **a conta de outro usuário fica intacta** — conferido
      com duas contas de teste.
- [ ] **CA7** — Toda afirmação da política foi conferida contra o código ou o banco, e a lista
      dessa conferência está no `plan.md`. Nenhuma frase ficou por verificar.
- [ ] **CA8** — Os três campos do *Branding* do Google OAuth são preenchidos com as URLs reais e o
      app sai do modo **Testando** — ou a spec registra por que não saiu.
- [ ] **CA-seg** — As páginas públicas não vazam nada de usuário; encerrar conta exige
      reautenticação; a operação de exclusão não dá à API poder de apagar **outro** usuário.
- [ ] **CA-a11y** — Tudo em 375 px, nos dois temas, nenhuma informação só por cor, e o diálogo de
      encerrar conta é operável por teclado.
- [ ] **CA-build** — `dotnet build api`, `dotnet test api`, `typecheck`, `lint`, `test` e `build`
      do `web`, e o E2E `readonly` passam.

## Decisão: o controlador é pessoa física

Decidido em 2026-11-08. O que isso significa, em concreto:

- **A política nomeia o Pedro**, pessoa natural, como controlador (art. 9º, III). É quem responde
  pelos dados — e isso não muda enquanto não houver empresa.
- **CPF não vai na política.** A lei pede identificação e **contato** do controlador, não documento.
  Publicar CPF seria exposição sem ganho nenhum.
- **O Pedro acumula o papel de encarregado.** O art. 41 não é sugestão: *"O controlador deverá
  indicar encarregado"*, e o § 1º manda **divulgar publicamente a identidade e o contato dele**,
  de preferência no site. Na prática, é publicar nome e email nas duas páginas — e ler o que
  chega: o § 2º, I põe sobre o encarregado "aceitar reclamações e comunicações dos titulares,
  prestar esclarecimentos e adotar providências".
  > ⚠️ Se a ANPD dispensa agente de pequeno porte de indicar encarregado formal, isso vem de
  > **resolução da ANPD, que não está no acervo de leis**. Conferir no site da ANPD antes de
  > escrever a cláusula; a LGPD sozinha não responde.
- **Se um dia houver empresa**, a política muda de titular: é alteração relevante, avisada a quem
  já tem conta (RN9).

## Perguntas resolvidas

| # | Pergunta | Resposta |
|---|---|---|
| 1 | Quem é o controlador? | **Pessoa física**, decidido em 08/11. Ver acima |
| 2 | A decisão **D2** muda a RN3? | **Não.** A D2 da [spec 007](../007-fundacao/spec.md) é sobre **conta bancária** com movimentos (item FI-01), e o [ADR 0017](../../adr/0017-excluir-conta-apaga-movimentacoes.md) é o que vale no código. Aqui é **conta de usuário** — assunto separado |
| 3 | Como apagar `auth.users` sem `service_role`? | **Resolve-se no `plan.md`, com ADR próprio.** O caminho que mantém a regra do projeto é uma função `security definer` no banco, restrita a apagar **o próprio** `auth.uid()` e nada mais. A alternativa (chamar o GoTrue com `service_role`) daria à API poder de apagar qualquer usuário — não passa |
| 4 | Formato da exportação | **JSON completo + CSV das movimentações.** O JSON é fiel e serve à portabilidade (art. 18, V); o CSV é o que a pessoa realmente abre no Excel. As duas coisas saem da mesma consulta |
| 5 | Idade mínima | **18 anos.** O app lida com dinheiro e contrato de adesão; tratar dado de criança e adolescente (art. 14) traria regra própria, inclusive consentimento de um dos pais, que o produto não tem como cumprir hoje. Os termos dizem isso |
| 6 | O backup no GitHub continua? | **Recomendo declarar e seguir.** O dump é cifrado com GPG antes de sair, dura 90 dias e nunca trafega em claro; trocar o destino é trabalho real para um ganho pequeno. Entra na política como transferência internacional (art. 33), com o porquê. **Vetável pelo Pedro** |

## Pré-condição: a caixa do titular

Decidido em 2026-11-08: o canal do titular é **`privacidade@veloswallet.com.br`**, caixa de
verdade no próprio domínio — não um endereço pessoal. O mesmo endereço serve ao art. 9º, IV
(contato do controlador) e ao art. 41, § 1º (contato do encarregado).

**Isto é do Pedro, e precisa estar pronto antes de publicar as páginas**, porque elas publicam o
endereço:

1. Criar a caixa num provedor — **Zoho Mail** tem plano grátis para domínio próprio; o Google
   Workspace é pago. Qualquer um serve.
2. No **Registro.br**, em modo avançado, criar os registros `MX` que o provedor indicar (e o
   `TXT` de verificação, se ele pedir).
3. **Não mexer** nos três registros do Resend — `resend._domainkey` (TXT), `send` e `rsend`
   (CNAME). O `MX` novo é de **receber**; o Resend continua a **enviar** como hoje.
4. Conferir nos servidores que realmente servem a zona, e não só no público:
   ```
   nslookup -type=NS veloswallet.com.br 8.8.8.8
   nslookup -type=MX veloswallet.com.br a.sec.dns.br
   ```
5. Mandar um email de teste de fora e **confirmar que chega**. Canal publicado que ninguém lê é
   pior do que canal nenhum: o art. 41, § 2º, I põe sobre o encarregado aceitar reclamações e
   adotar providências.

> O `MX` do Resend (`receive-sae1.forge.rmta.net`) **continua fora**, de propósito — era
> justamente ele que prenderia o domínio ao Resend. O `MX` do provedor de caixa não tem essa
> relação.

## Perguntas em aberto

Nenhuma. **A spec está pronta para aprovação.**
