# Ideias

> Caderno de ideias do Pedro, para **depois** do MVP. Nada aqui está decidido nem aprovado.
> Uma ideia só vira trabalho quando virar spec em `docs/specs/NNN-nome/`.
>
> Antes de acrescentar: ver se já está no **"Fora do escopo do MVP"** da [VISAO](VISAO.md) ou na
> **Fase 6 — Pós-MVP** da [auditoria](audit/08-implementation-roadmap.md) (X1 a X8). Se estiver,
> o detalhe novo entra lá, não aqui.
>
> Formato: **o que é · por que · o que já existe · o que falta decidir**. O "o que falta decidir"
> é o que impede de virar spec hoje.

---

## I1 — Lembrete para não esquecer de lançar

*2026-11-01 · relacionada com [X7](audit/08-implementation-roadmap.md) (push, P3) e [X8](audit/08-implementation-roadmap.md) (Open Finance, P3)*

### O que é

Uma notificação que lembra a pessoa de registrar o que gastou no dia. A ideia original: perto do
fim do dia, se a pessoa gastou, fez transação ou investiu e **não anotou nada**, mandar um lembrete
— algo como *"Ei, você fez alguma transação hoje? Anote na Velos"*.

### Por que

Ataca o risco número um do produto, que o princípio **"Registro em segundos"** da [VISAO](VISAO.md)
já nomeia: *"Se registrar for chato, a pessoa desiste do hábito."* O app resolve bem o **custo** de
lançar (3 toques); não resolve a **lembrança** de lançar. Um app de finanças morre por esquecimento,
não por dificuldade. Liga-se direto à métrica "depois do lançamento" de uso recorrente.

### O que já existe a favor

- **A Etapa 8 entrega o PWA instalável** ([spec 009](specs/009-pwa/spec.md)). Notificação push no
  iPhone **só funciona com o PWA instalado** (iOS 16.4+), então a ordem está certa: o PWA vem antes.
- O banco já sabe a data de cada transação, então "não lançou nada hoje" é uma consulta trivial.

### O que falta decidir (e por que isto ainda não é uma spec)

**1. O app não tem como saber que a pessoa gastou.** Esta é a parte que muda a ideia. Sem
integração bancária, o Velos não enxerga a compra no mercado — ele só sabe o que foi digitado nele.
Então existem duas versões:

| Versão | Gatilho | Viável hoje? |
|---|---|---|
| **Por inatividade** | "Você não lançou nada hoje" | **Sim**, só precisa de push |
| **Por gasto real** | "Você gastou R$ 180 e não anotou" | **Não**: depende de Open Finance, que está em "Fora do escopo" da VISAO e é X8 (P3, "não recomendado agora") |

A versão por inatividade entrega quase todo o valor com uma fração do custo. A por gasto real fica
registrada como o destino, não como o começo.

**2. De 3 em 3 horas é muito.** É o ponto em que eu discordaria da ideia original. Lembrete de app
de finanças que insiste vira notificação silenciada, e notificação silenciada é pior que nenhuma:
perde-se o canal para sempre. Minha recomendação:

- **um lembrete por dia**, num horário que a pessoa escolhe (padrão: 20h, de São Paulo);
- **não manda se a pessoa já lançou alguma coisa naquele dia** — o lembrete tem de desaparecer
  quando o hábito está funcionando, senão castiga quem acertou;
- janela de silêncio obrigatória (nada entre 22h e 8h);
- desligar numa tela só, sem procurar.

Se for para testar frequência maior, que seja com o Pedro primeiro, medindo quantos dias até
silenciar.

**3. A notificação não pode mostrar valores.** O princípio **"Privado por padrão"** e a faixa da
página inicial prometem isso. Um aviso na tela de bloqueio dizendo *"você gastou R$ 180"* entrega o
dado financeiro para quem olhar o celular por cima do ombro. O texto tem de ser neutro: lembra de
lançar, não diz quanto.

**4. Peças que não existem ainda:** chaves VAPID, tabela de inscrições de push por dispositivo,
pedido de permissão na hora certa (nunca no primeiro acesso), e um agendador do lado do servidor —
que é a primeira coisa no projeto a precisar rodar sem ninguém pedir. Hoje a API só responde a
requisições. Isso é decisão de arquitetura e pede ADR próprio.

**5. Esperar o MVP validado.** Lembrete é ferramenta de retenção: só faz sentido quando já há gente
usando para reter. Antes disso, otimiza-se um número que ninguém está medindo.

---

## I2 — Assinatura mensal com 7 dias grátis

*2026-11-01 · **mexe numa decisão que já existe**: ver "Modelo de negócio" na [VISAO](VISAO.md)*

### O que é

Plano de assinatura mensal. A pessoa usa o app de graça por **7 dias**; passado o prazo, recebe uma
notificação pedindo o pagamento para continuar usando. A cobrança acontece **a cada pagamento que a
pessoa faz** — ou seja, renovação manual mês a mês, não débito automático no cartão.

### Por que

Receita desde o primeiro usuário, sem depender de volume. A renovação manual tem uma vantagem real
no Brasil: funciona com **Pix**, sem exigir cartão de crédito — o que derruba a barreira de entrada
e combina com o público da [VISAO](VISAO.md), que é quem está começando a se organizar.

### O conflito com o que já está decidido

A VISAO diz hoje: *"gratuito durante o MVP e a validação. O foco agora é divulgar a marca e medir
interesse"*, e só decide o modelo **quando a lista de espera passar de 200 pessoas**, perguntando
antes se as pessoas pagariam.

Um paywall de 7 dias é o oposto disso, e o problema é de **ordem, não de mérito**:

- As métricas "antes do lançamento" são 200 na lista de espera, 500 seguidores e 100 visitas por
  semana. Nenhuma delas se mede com um app que trava no oitavo dia.
- As métricas "depois do lançamento" — ativação em 24 h, hábito na quarta semana — **medem-se em
  4 semanas**. Com 7 dias de acesso, a métrica de hábito nunca é observada: o usuário sai antes.
- Cobrar antes de saber se o produto segura alguém mede a disposição de pagar por uma promessa, não
  pelo produto.

**Minha recomendação:** manter a ideia e mudar o momento. Lançar grátis, medir ativação e hábito por
um mês com gente real, e aí ligar a assinatura — já sabendo o que o app entrega. A alternativa da
própria VISAO (freemium: o essencial grátis, o avançado pago) sofre menos desse problema, porque não
tira o app de quem ainda está decidindo.

### O que falta decidir (além do momento)

**1. Provedor de pagamento.** Para Pix com renovação manual, os caminhos no Brasil são Mercado Pago,
Asaas, Pagar.me ou Stripe. É decisão de ADR, e puxa: webhook de confirmação, conciliação, reembolso,
e o que acontece se o Pix cair fora do horário.

**2. O que acontece com os dados de quem não paga.** Esta é a parte delicada, e é jurídica antes de
ser de produto. O app guarda a vida financeira da pessoa. Travar o acesso não pode travar o direito
de **exportar e excluir** os próprios dados — que é exatamente o item L1 (LGPD) do
[roadmap da auditoria](audit/08-implementation-roadmap.md), ainda não feito. Então **a LGPD vem
antes da assinatura**, não depois. Sugestão: expirado o prazo, a conta vira somente-leitura com
exportação liberada, em vez de bloquear tudo.

**3. Emitir nota e receber dinheiro exige CNPJ.** MEI, nota fiscal, imposto. Não é código, mas é
pré-requisito de verdade e tem prazo próprio — começar cedo.

**4. Lembrete de pagamento usa o mesmo encanamento da [I1](#i1--lembrete-para-não-esquecer-de-lançar)**
(push, inscrições, agendador). Se as duas forem em frente, a I1 vem primeiro e a I2 reaproveita.

**5. Quem já usava quando o plano ligar.** Precisa de uma regra explícita — normalmente, quem entrou
antes fica grátis para sempre ou ganha um prazo longo. Decidir **antes** de ligar a cobrança, porque
mudar depois queima confiança.
