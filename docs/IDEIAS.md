# Ideias

> Caderno de ideias do Pedro, para **depois** do MVP. Nada aqui está decidido nem aprovado.
> Uma ideia só vira trabalho quando virar spec em `docs/specs/NNN-nome/`.
>
> Antes de acrescentar: ver se já está no **"Fora do escopo do MVP"** da [VISAO](VISAO.md) ou na
> **Fase 6 — Pós-MVP** da [auditoria](audit/08-implementation-roadmap.md) (X1 a X8). Se estiver,
> o detalhe novo entra lá, não aqui.
>
> Formato: **o que é · por que · o que falta decidir**. O "o que falta decidir" é o que impede de
> virar spec hoje — sem isso, a ideia não serve daqui a seis meses.

## Índice

| # | Ideia | Tamanho | Depende de |
|---|---|---|---|
| [I1](#i1--assistente-proativo-lembretes-e-resumos) | Assistente proativo: lembretes e resumos | G | PWA, push, agendador |
| [I2](#i2--assinatura-do-velos-saas-com-7-dias-grátis) | Assinatura do Velos (SaaS) | G | LGPD, CNPJ, gateway, push |
| [I3](#i3--central-de-notícias-financeiras) | Central de notícias financeiras | G | API externa, IA, licenciamento |
| [I4](#i4--velos-score) | Velos Score (0 a 100) | M | histórico de uso real |
| [I5](#i5--e-se-você-não-tivesse-gastado) | "E se você não tivesse gastado?" | M | nada novo |
| [I6](#i6--radar-de-assinaturas-do-usuário) | Radar de assinaturas do usuário | M | recorrência (fora do escopo) |
| [I7](#i7--velos-ai-atendimento) | Velos AI (atendimento) | G | painel admin, IA, base de conhecimento |

**Leia antes a seção [Dependências em comum](#dependências-em-comum)**: quatro peças que não existem
no projeto sustentam quase tudo aqui, e cada uma é trabalho próprio.

---

## Dependências em comum

As sete ideias parecem independentes, mas apoiam-se nas mesmas quatro coisas, **nenhuma das quais
existe hoje**. Construir uma ideia isolada significa construir a fundação junto; construir a
fundação uma vez destrava várias.

### D-A · Notificações push

Precisam: chaves VAPID, tabela de inscrições por dispositivo, pedido de permissão na hora certa, e
**um agendador rodando no servidor** — hoje a API só responde a requisições, nunca age sozinha.
Isso é decisão de arquitetura e pede ADR próprio (onde roda, o que acontece se cair, como não
mandar duas vezes).

No iPhone, push **só funciona com o PWA instalado** (iOS 16.4+), então a [spec 009](specs/009-pwa/spec.md)
vem antes de qualquer coisa aqui.

**Usada por:** I1, I2 (aviso de cobrança), I6 (próxima cobrança), I3 (alertas econômicos).

### D-B · Inteligência artificial

Precisa: escolher provedor, guardar a chave no servidor (nunca no front), controlar custo por
usuário, e decidir o que acontece quando a API da IA cai ou demora.

A regra que o próprio Pedro escreveu nos prompts e que vale para todas: **a IA explica, o backend
calcula**. Nenhum número mostrado ao usuário pode sair de um modelo de linguagem.

Nota: a auditoria classifica IA como **X8, P3, "não recomendado agora"**.

**Usada por:** I3 (resumos), I4 (só para explicar, nunca para pontuar), I5 (texto), I7 (o agente).

### D-C · Conceito de administrador

**Não existe nada disso hoje.** Confirmado no código: o único "role" do projeto é o do Postgres
(`anon` / `authenticated`) que faz a RLS funcionar. Não há usuário administrador, não há permissão
por papel, não há painel.

Criar isso é um eixo novo inteiro: papéis, autorização no backend, telas protegidas, auditoria de
quem fez o quê — e mexe na parte mais sensível do sistema, que é a que garante que um usuário não
vê os dados do outro.

**Usada por:** I7 (aprovar conhecimento), I2 (painel de assinaturas e indicadores).

### D-D · LGPD (item L1 da auditoria, ainda não feito)

Exportar e excluir os próprios dados, páginas de privacidade e termos. Já é necessário para lançar
ao público; vira **obrigatório antes** de qualquer ideia que cobre dinheiro ou guarde conversa.

**Usada por:** I2 (não se pode travar o acesso sem deixar exportar), I7 (histórico de conversas).

---

## Nota de realidade sobre o tamanho disto

Estas sete ideias, somadas, são **maiores que todo o Velos construído até agora**. O app inteiro —
autenticação, banco, contas, transações, dashboard, metas, PWA — levou 8 dias de trabalho ativo.
Este caderno tem três itens de porte "G" que sozinhos passam disso, mais quatro de porte médio,
mais quatro fundações que não existem.

Isso não é argumento contra nenhuma delas. É só para a conta bater quando chegar a hora de escolher:
a [previsão de lançamento](ROADMAP.md) é de meados de novembro para o app no ar e início de dezembro
para o público, e **nada deste caderno cabe nessa janela**. O caminho sensato é lançar o que existe,
medir a ativação e o hábito com gente real, e deixar que esses números escolham qual destas vem
primeiro — em vez de escolher agora, no escuro.

---

## I1 — Assistente proativo: lembretes e resumos

*2026-11-01 · relacionada com [X7](audit/08-implementation-roadmap.md) (push, P3)*

### O que é

A Velos deixa de esperar que a pessoa abra o app e passa a lembrá-la, com linguagem amigável e
variada, em quatro frentes:

1. **Lembrete de movimentação não registrada** — detecta dias sem lançamento e avisa no dia seguinte,
   com atalho direto para a tela de lançar.
2. **Alertas de gasto** — avisa quando as despesas sobem em relação ao histórico, ou quando um
   orçamento definido se aproxima do limite.
3. **Lembretes de meta** — progresso, incentivo, aviso quando está perto de atingir.
4. **Resumos programados** — diário opcional, semanal de entradas e saídas, fechamento mensal com
   comparação entre períodos.

Mais uma área de configurações: ligar e desligar por tipo, escolher horários, frequência e horário
silencioso.

### Por que

Ataca o risco número um do produto, que o princípio **"Registro em segundos"** da [VISAO](VISAO.md)
já nomeia: *"Se registrar for chato, a pessoa desiste do hábito."* O app resolve o **custo** de
lançar (3 toques); não resolve a **lembrança**. Um app de finanças morre por esquecimento, não por
dificuldade.

### O que falta decidir

**1. O app não sabe que a pessoa gastou.** Sem integração bancária, a Velos só enxerga o que foi
digitado nela. O próprio prompt já acerta isso ao dizer *"não confundir ausência de lançamentos com
ausência de gastos"* — e essa frase é exatamente o limite da funcionalidade:

| Versão | Gatilho | Viável? |
|---|---|---|
| Por inatividade | "Você não lançou nada ontem" | **Sim** |
| Por gasto real | "Você gastou R$ 180 e não anotou" | **Não**: depende de Open Finance (X8, fora do escopo) |

**2. Frequência.** A ideia original falava em lembrete de 3 em 3 horas. Lembrete de app financeiro
que insiste vira notificação silenciada — e aí perde-se o canal para sempre, não só aquele aviso.
Recomendo: um por dia, em horário escolhido, **que não dispare se a pessoa já lançou algo**. O
lembrete tem de sumir quando o hábito funciona, senão castiga quem acertou. Nada entre 22h e 8h.

**3. A notificação não pode mostrar valores.** O princípio **"Privado por padrão"** e a faixa da
página inicial prometem isso. *"Você gastou R$ 180"* na tela de bloqueio entrega o dado para quem
olhar o celular por cima do ombro. Texto neutro: lembra de lançar, não diz quanto.

**4. Os alertas de orçamento dependem de algo que não existe.** "Orçamento próximo do limite" exige
orçamentos por categoria, que é o **X1** da Fase 6 e ainda não foi feito. Essa parte da I1 não
começa antes do X1.

**5. Fuso horário por usuário.** O app hoje assume São Paulo em todo lugar. Resumo "diário" e
horário silencioso exigem saber o fuso de cada pessoa — campo novo e regra nova.

**6. Infraestrutura:** ver [D-A](#d-a--notificações-push).

---

## I2 — Assinatura do Velos (SaaS) com 7 dias grátis

*2026-11-01 · **mexe numa decisão que já existe**: ver "Modelo de negócio" na [VISAO](VISAO.md)*

### O que é

Transformar a Velos num SaaS com monetização recorrente, com estrutura completa e não só a tela:

- **Teste gratuito:** 7 dias corridos, sem pedir cartão, acesso total, contagem a partir do cadastro,
  sem como reiniciar criando outra sessão.
- **Mensal:** R$ 19,90 · **Anual:** R$ 197,00 (≈17% de economia).
- Avisos no 5º, 6º e 7º dia; indicador discreto no painel com os dias restantes.
- Estados explícitos: `TRIAL`, `ACTIVE`, `PAST_DUE`, `EXPIRED`, `CANCELED`, `PENDING`.
- Gateway (Asaas como primeira opção, Mercado Pago como alternativa), webhooks com idempotência,
  tolerância de 3 dias na inadimplência, controle de acesso validado **no backend**.
- Área "Minha assinatura" para o usuário e painel administrativo com MRR, churn e conversão.

### Por que

Receita desde o primeiro usuário, sem depender de volume.

### O conflito com o que já está decidido

A VISAO diz hoje: *"gratuito durante o MVP e a validação. O foco agora é divulgar a marca e medir
interesse"*, e só decide o modelo **quando a lista de espera passar de 200 pessoas**.

Um paywall de 7 dias é o oposto, e o problema é de **ordem, não de mérito**:

- As métricas "antes do lançamento" são 200 na lista de espera, 500 seguidores, 100 visitas por
  semana. Nenhuma se mede com um app que trava no oitavo dia.
- As métricas "depois do lançamento" — ativação em 24 h, **hábito na quarta semana** — levam 4
  semanas. Com 7 dias de acesso, a de hábito nunca chega a ser observada.
- Cobrar antes de saber se o produto segura alguém mede disposição de pagar por uma promessa, não
  pelo produto.

**Recomendação:** manter a ideia, mudar o momento. Lançar grátis, medir um mês com gente real, e aí
ligar a cobrança já sabendo o que o app entrega.

### Mudança em relação à primeira versão desta ideia

A primeira formulação era **renovação manual** ("cobrado toda vez que a pessoa faz o pagamento"), o
que funcionava com **Pix sem exigir cartão** — uma vantagem real para quem está começando a se
organizar. A formulação nova é **renovação automática**. São produtos diferentes: a automática
converte melhor, a manual tem menos atrito de entrada e menos churn involuntário. Decidir qual, ou
oferecer as duas.

### O que falta decidir

**1. A LGPD vem antes, não depois.** Travar o acesso não pode travar o direito de **exportar e
excluir** os próprios dados — item [D-D](#d-d--lgpd-item-l1-da-auditoria-ainda-não-feito). O próprio
prompt já manda preservar tudo; falta a ferramenta para a pessoa levar os dados embora. Sugestão:
expirado o prazo, a conta vira **somente-leitura com exportação liberada**, em vez de bloquear tudo.

**2. Receber dinheiro exige CNPJ.** MEI, nota fiscal, imposto. Não é código, tem prazo próprio e é
pré-requisito de verdade — começar cedo.

**3. O painel administrativo não existe** — ver [D-C](#d-c--conceito-de-administrador). É metade do
trabalho desta ideia, e é a metade que mexe na segurança.

**4. Quem já usava quando o plano ligar.** Precisa de regra explícita (grátis para sempre? prazo
longo?), decidida **antes** de ligar a cobrança: mudar depois queima confiança.

**5. Pix e recorrência não se dão bem.** Cobrança recorrente automática no Brasil é natural no
cartão; no Pix depende de Pix Automático, com suporte desigual entre gateways. Conferir antes de
prometer "mensal no Pix".

**6. Nenhuma das 7 tabelas de hoje serve.** Entram `subscriptions`, `plans`, `payments`,
`webhook_events`, `subscription_history` — todas com `user_id`, RLS e políticas por comando, como
manda o CLAUDE.md.

---

## I3 — Central de notícias financeiras

*2026-11-01 · **expande o escopo do produto**, não só as funcionalidades*

### O que é

Uma aba **Notícias** dentro do app, com categorias (Para você, Economia, Investimentos, Bolsa,
Cripto, Finanças pessoais), alimentada por APIs gratuitas (Capital Agora, NewsData.io, Alpha
Vantage) consumidas pelo backend com cache e deduplicação. Em cima disso, IA para **resumo
inteligente**, **"por que isso importa?"** e **glossário** de termos (CDI, Selic, IPCA, liquidez).
Mais favoritar, compartilhar, buscar e filtrar.

Explicitamente: a IA **não** vira recomendação de compra ou venda.

### Por que

Transforma a Velos de gerenciador em ferramenta de informação e educação financeira, e dá motivo
para abrir o app em dias sem lançamento.

### O que falta decidir

**1. Isto muda o que o produto é.** Hoje a VISAO define a Velos por três perguntas — para onde foi
meu dinheiro, com quanto posso contar, estou chegando perto do que quero. Notícia não responde a
nenhuma. É uma segunda razão de existir dentro do mesmo app, e esbarra no princípio **"Simples antes
de completo"**. A pergunta antes da técnica: **a Velos é um app de finanças pessoais ou um portal?**

**2. Risco de autoridade.** Juntar "sua vida financeira" com "o que está acontecendo no mercado" faz
o usuário esperar que a Velos tenha opinião — e o passo seguinte, que ela diga o que fazer com o
dinheiro dele. O prompt já proíbe recomendação, e isso está certo, mas a expectativa se cria sozinha.

**3. Conteúdo de terceiros tem dono.** Resumir notícia com IA e exibir imagem de capa envolve direito
autoral e os termos de cada API. Cada provedor permite coisas diferentes, e "gratuito" quase sempre
vem com limite de requisições e restrição de uso comercial — o que colide com a I2. Ler os termos
**antes** de escolher, não depois.

**4. Três APIs é demais para começar.** Uma só, na primeira versão, como o próprio prompt sugere.

**5. Custo de IA por notícia lida**, somado a [D-B](#d-b--inteligência-artificial). Resumir sob
demanda e guardar o resumo, nunca resumir duas vezes a mesma notícia.

---

## I4 — Velos Score

*2026-11-01*

### O que é

Pontuação de 0 a 100 da organização financeira, calculada **só com dados reais** do usuário:
regularidade de registro, despesas em relação às receitas, cumprimento de metas, organização de
contas, evolução da reserva. Cada indicador com peso documentado. Tela com a nota, classificação,
evolução sobre o mês anterior, histórico e recomendações.

Regras que o prompt já fixa, e que são as certas: **cálculo determinístico no backend, nunca por
IA**; não penalizar por renda baixa; deixar claro quando há dados insuficientes; **não é análise de
crédito**.

### Por que

Dá ao usuário uma leitura única do próprio comportamento e um motivo para voltar — a nota muda.

### O que falta decidir

**1. Mede o uso do app ou a saúde financeira?** "Regularidade no registro" mede disciplina de
digitar, não saúde do dinheiro. Quem organiza tudo numa planilha e lança uma vez por mês tira nota
baixa sendo mais organizado que a média. Misturar as duas coisas numa nota só é o risco central
desta ideia, e é de desenho, não de código.

**2. Nota baixa desmotiva quem mais precisa.** Quem está endividado abre o app, vê 23/100 e fecha.
Vale decidir se a nota aparece desde o primeiro dia ou só depois de histórico suficiente — e se o
tom é nota ou diagnóstico.

**3. Pesos precisam de dado real para calibrar.** Definir peso de indicador sem ver distribuição de
usuários é chute. Isso **depende do lançamento**, não só de tempo.

**4. "Evolução da reserva" não é calculável hoje.** O app não distingue conta de reserva de conta do
dia a dia; poupança é só um tipo. Ou se usa o progresso das metas como proxy, ou entra o conceito de
reserva.

**5. Isto é a parte boa:** sendo determinístico e testável, é a ideia mais barata de validar antes
de construir — dá para calcular a nota sobre dados reais e ver se o resultado faz sentido, sem tela
nenhuma.

---

## I5 — "E se você não tivesse gastado?"

*2026-11-01 · parente do [X1](audit/08-implementation-roadmap.md) (orçamentos, P2)*

### O que é

Analisa as despesas e simula quanto a pessoa economizaria cortando um percentual de uma categoria,
com projeção para o próximo mês, 6 e 12 meses. Cortes de 10%, 20%, 30% ou valor livre, com o
resultado mudando na hora. Botão para **transformar a simulação em meta** — que é a parte mais forte
da ideia, porque liga a simulação ao que o app já faz bem.

### Por que

Transforma dado em ação. É a ponte natural entre o dashboard (que mostra para onde foi) e as metas
(que mostram para onde vai).

### O que falta decidir

**1. É a mais barata das sete.** Usa só o que já existe — transações, categorias, metas — e é
aritmética sobre dados que o banco já soma. Sem API externa, sem IA obrigatória, sem push, sem
admin. **Se for para escolher uma para começar, é esta.**

**2. Não transformar projeção em promessa.** "Você vai economizar R$ 1.200 por ano" é falso: é o que
aconteceria *se* o corte se mantivesse 12 meses. A linguagem tem de deixar o "se" visível, e o
próprio prompt já pede isso.

**3. Cortar o que?** O prompt acerta ao proibir classificar despesa como "desnecessária"
automaticamente. Mas sem isso, a tela oferece cortar "Moradia" do lado de "Lazer". Ou a pessoa
escolhe a categoria, ou o app precisa de um conceito de essencial — que ele não tem.

**4. Pouco dado, nenhuma análise.** Com um mês de uso não há comparação possível. Precisa de um
mínimo de histórico e de dizer isso em vez de mostrar número fraco.

---

## I6 — Radar de assinaturas do usuário

*2026-11-01 · **não confundir com a [I2](#i2--assinatura-do-velos-saas-com-7-dias-grátis)**: aqui são as assinaturas que o **usuário** paga (Netflix, Spotify, academia); a I2 é a assinatura da **Velos***

### O que é

Área para cadastrar e acompanhar despesas recorrentes: nome, categoria, valor, periodicidade,
próxima cobrança, forma de pagamento, status (ativa, pausada, cancelada). Painel com total mensal e
anual estimado, próximas cobranças e calendário. Alertas de cobrança chegando. E uma lógica que
**sugere** assinaturas a partir de repetições no histórico — sempre perguntando, nunca cadastrando
sozinha.

### Por que

Assinatura esquecida é o gasto que mais dói quando se descobre, e é invisível no extrato mensal
porque cada uma é pequena. Mostrar o total anual ("você paga R$ 1.400 por ano em streaming") é o
tipo de número que muda comportamento.

### O que falta decidir

**1. Recorrência está em "Fora do escopo do MVP"** da VISAO, e é o X6 da Fase 6 (P3, esforço G). Esta
ideia reintroduz o conceito por outra porta. Não é proibido — mas é mudança de escopo explícita, e a
VISAO diz "não reintroduzir no meio de outra etapa".

**2. Assinatura cadastrada vira transação?** É a decisão de modelagem central. Se virar, o dinheiro
entra duas vezes quando a pessoa também lançar a despesa. Se não virar, o radar vive separado do
resto e os totais não conversam com o dashboard. As duas saídas têm custo, e esta é decisão de ADR.

**3. Detecção automática é mais difícil do que parece.** "Netflix R$ 39,90 todo dia 10" é fácil;
valor que muda, data que varia, nome que vem diferente a cada mês não é. Começar sugerindo só o caso
óbvio, e aceitar que vai errar.

**4. Logotipo de serviço tem dono.** Exibir a marca da Netflix exige cuidado com uso de marca.

---

## I7 — Velos AI (atendimento)

*2026-11-01*

### O que é

Um agente de atendimento com **base de conhecimento evolutiva**. Três níveis: responde direto quando
há conhecimento aprovado; usa IA para interpretar quando a pergunta é diferente mas a base cobre;
e **reconhece que não sabe**, registrando a dúvida. O administrador revisa a fila de perguntas sem
resposta, cadastra a resposta oficial, aprova — e só então o agente passa a usá-la.

Mais: agrupamento de perguntas semelhantes, histórico de conversas, avaliação de resposta,
indicadores de atendimento e controle de custo de IA.

### Por que

Suporte que melhora sozinho sem inventar nada, e sem ninguém de plantão.

### O que falta decidir

**1. É a maior das sete, com folga.** São três sistemas: o chat, a base de conhecimento com fluxo de
aprovação, e o painel administrativo. Mais a camada de IA. Sozinha, passa de tudo o que a Velos é
hoje.

**2. O painel administrativo não existe** — [D-C](#d-c--conceito-de-administrador). Antes do agente
vem papéis, autorização e telas protegidas, mexendo na parte que garante o isolamento entre usuários.

**3. Quem atende, no começo, é você.** Enquanto a base está vazia, todo atendimento cai no nível 3 e
vira fila para o Pedro responder. Um FAQ bem escrito resolve 80% disso sem código nenhum — e é o
jeito honesto de descobrir **quais** são as perguntas antes de construir a máquina de respondê-las.

**4. Antes disso tudo: quantos usuários existem?** Suporte automatizado resolve problema de volume.
Com dezenas de usuários, responder à mão é mais rápido, mais barato e ensina mais.

**5. O que o prompt já acerta** e vale manter quando for a hora: o agente nunca aprende sozinho (só
conteúdo aprovado vira resposta), nunca finge ser humano, não dá conselho financeiro personalizado,
e é protegido contra instruções maliciosas vindas na mensagem do usuário. Essa última não é detalhe:
é um usuário tentando fazer o agente ignorar as próprias regras, e tem de ser tratada como ataque,
não como pergunta estranha.

**6. Não guardar o que não precisa.** Conversa de suporte com app financeiro recolhe dado sensível
sem querer. O prompt já manda proteger; some com [D-D](#d-d--lgpd-item-l1-da-auditoria-ainda-não-feito).
