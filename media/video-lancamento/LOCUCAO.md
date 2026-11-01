# Locução do Reels — roteiro e como gerar

Sete falas. Os tempos vivem em `remotion/src/vertical/falas.json`, lido tanto pelo gerador de
áudio (Node) quanto pelo `Reels.tsx` (TypeScript) — um JSON só, para os dois não divergirem.

## Princípio

**A voz não lê o que já está escrito na tela.** O título grande diz uma coisa, a voz diz a
seguinte — senão a pessoa ouve e lê a mesma frase, e o vídeo fica redundante. A única exceção é
a chamada final, onde repetir é o objetivo.

Tom, conforme `DESIGN-MOTION.md`: próxima e direta, "você", frases curtas, sem jargão de banco e
sem gíria. Nada de euforia de locutor de varejo.

## Tamanho das falas

Uma leitura calma em português faz **~4,5 sílabas por segundo**. Uma frase de 10 sílabas ocupa
~2,2 s. Foi medindo isso que as cenas cresceram: na primeira montagem, cada tela da vitrine tinha
3,2 s e nenhuma frase cabia com respiro. Hoje cada tela tem 3,8 s e o vídeo tem 28,8 s.

Nenhuma fala passa de 12 sílabas. O espaço que sobra é respiro — locução sem respiro soa a
leitura de bula.

## As falas

| # | Entra em | Cabe em | Texto | O que está na tela |
|---|---|---|---|---|
| 1 | 0,7 s | 2,6 s | Para onde foi seu dinheiro? | "Seu dinheiro na direção certa." |
| 2 | 5,6 s | 3,2 s | O Velos junta tudo num número só. | "Todas as contas num lugar só" |
| 3 | 9,4 s | 3,2 s | E mostra o que sobrou no mês. | "Quanto entrou, quanto saiu" |
| 4 | 13,2 s | 3,2 s | Cada gasto no seu lugar. | "Para onde o dinheiro foi" |
| 5 | 17,0 s | 3,2 s | E quanto falta para a meta. | "E quanto falta para a sua meta" |
| 6 | 20,8 s | 3,4 s | Sem baixar nada, só você vê. | "Sem loja de apps." |
| 7 | 24,7 s | 4,1 s | Velos Wallet. Crie sua conta grátis. | "Velos Wallet" + botão |

A fala 1 é uma **pergunta**, de propósito: é o gancho dos dois primeiros segundos, que decidem se
a pessoa continua, e não afirma nenhum dado que o produto não possa sustentar.

Nenhuma fala promete usuário, avaliação, número de downloads ou resultado financeiro — as mesmas
proibições do brief valem para o áudio.

## Gerar o rascunho (sem conta nenhuma)

A voz **Microsoft Maria** (pt-BR) já existe no Windows. É robótica e **não serve para publicar**,
mas serve para conferir se cada fala cabe antes de gastar crédito em qualquer serviço:

```bash
npm run locucao --prefix remotion
```

O script mede cada faixa e diz `ok`, `apertado` ou `ESTOUROU`.

## Gerar com voz de IA (Kokoro — é o que está no vídeo)

[Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M) é **Apache-2.0** e **não é gated**: não
exige aceitar licença, criar conta nem pagar. Para uma peça comercial é a licença mais limpa
possível. Roda local, em CPU, pelo ONNX Runtime.

```bash
npm run locucao:ia --prefix remotion                    # voz padrão, pf_dora
npm run locucao:ia --prefix remotion -- --voz pm_alex   # masculina
npm run locucao:ia --prefix remotion -- --ritmo 0.95    # um pouco mais devagar
```

Vozes pt-BR disponíveis: `pf_dora` (feminina), `pm_alex` e `pm_santa` (masculinas).

**Onde está instalado:** `C:\Users\pedro\.local\kokoro-tts\` — ambiente próprio com Python 3.12,
`kokoro-onnx`, o modelo `kokoro-v1.0.fp16.onnx` (163 MB) e `voices-v1.0.bin` (28 MB). Fica fora
do repositório de propósito: são binários regeráveis.

Para recriar do zero:

```bash
uv venv --python 3.12
uv pip install kokoro-onnx soundfile
# baixar os dois arquivos da release model-files-v1.1 de thewh1teagle/kokoro-onnx
```

> Os avisos `onnxruntime ... constant folding` ao gerar são ruído do modelo fp16 em CPU. Não
> indicam falha.

## Por que não o VoiceStudio

O VoiceStudio **está instalado e funcional** (backend em `localhost:3900`), mas nenhum caminho
dele serviu para esta locução:

- O engine padrão (OmniVoice) devolve **403 `model_licence_required`** — os pesos exigem aceitar
  uma licença na interface, que é um ato do dono do projeto, não do agente.
- `kittentts` não pede licença, mas é **só inglês**.
- `pockettts` é CC-BY-4.0, porém **gated** no HuggingFace (HTTP 401) — exigiria conta lá.
- `confucius4-tts` é Apache-2.0 e seria ideal, mas a instalação falha: o upstream devolve um
  tarball sem `requirements.txt` no commit que o VoiceStudio fixa.

Ele continua útil para o que o Kokoro não faz — clonagem de voz a partir de uma gravação sua.

## Gerar com o VoiceStudio (clonagem de voz)

[VoiceStudio](https://github.com/debpalash/VoiceStudio) é uma alternativa local e de código
aberto ao ElevenLabs. Roda na própria máquina: o texto e o áudio não saem daqui, e não há chave
nem crédito.

**1. Instalar** (uma vez). Baixar `VoiceStudio-<versão>-win-x64.exe` (~222 MB) das
[releases](https://github.com/debpalash/VoiceStudio/releases/latest) e rodar o instalador.

**2. Instalar um modelo em português.** Abrir o app → **Model Catalogue** → escolher um engine
com português e aceitar a licença dele.

> **Atenção à licença do modelo.** O VoiceStudio é AGPL-3.0 e o uso comercial da *aplicação* é
> livre, mas **os pesos de cada modelo têm termos próprios** e vários são *research /
> non-commercial*. Este vídeo é peça de divulgação do produto, ou seja, uso comercial.
>
> | Engine | Código | Pesos | Serve aqui? |
> |---|---|---|---|
> | PocketTTS | MIT | CC-BY-4.0 (gated no HuggingFace) | sim, com atribuição |
> | Supertonic-3 | MIT | OpenRAIL-M, com restrições de uso | ler os termos antes |
> | Breeze-TTS-2 | — | research / non-commercial | **não** |
>
> Confirmar sempre no diálogo de aceitação do próprio app: a tabela acima vale para a versão
> 0.5.7 e os termos mudam.

**3. Deixar o app aberto** e listar as vozes instaladas:

```bash
npm run locucao:vs --prefix remotion -- --listar-vozes
```

**4. Gerar**, com um id devolvido pelo comando acima:

```bash
npm run locucao:vs --prefix remotion -- --voz <profile_id>
```

O backend padrão é `http://localhost:3900`; se estiver noutro endereço, passar `--url`.
O script confere `/health` antes de começar e valida que o que voltou é mesmo áudio.

## Gerar a versão final com o ElevenLabs

```bash
export ELEVENLABS_API_KEY=...     # nunca commitar nem colar em chat
npm run locucao:11labs --prefix remotion -- --voz <voice_id>
```

Voz recomendada: brasileira, registro calmo. Evitar as vozes "enérgicas de anúncio" — contradizem
a identidade sóbria da marca. Ajustes usados: `stability` 0.45, `similarity_boost` 0.75,
`style` 0.15. Estabilidade alta demais deixa a leitura morta; baixa demais faz a voz "atuar".

## Gravar você mesmo (o caminho mais rápido, e muitas vezes o melhor)

Para um produto de uma pessoa, a sua própria voz costuma soar melhor do que uma voz sintética
genérica — e são 20 segundos de gravação no celular.

Salvar cada fala como `01`…`07` (`.m4a`, `.wav` ou `.mp3`) em
`media/video-lancamento/gravacoes/`, e rodar:

```bash
npm run locucao:minha --prefix remotion
```

O script converte, **corta o silêncio das pontas** (não precisa editar), nivela a −16 LUFS como
os outros motores e avisa se alguma fala passou do espaço dela.

Essa pasta está dentro do OneDrive: salvando ali pelo app do OneDrive no celular, o arquivo
chega sozinho ao PC. As instruções e a lista das falas estão em `gravacoes/LEIA-ME.txt`.

## Como a voz entra no vídeo

`Reels.tsx` monta as sete faixas de `public/audio/voz/NN.wav` e **abaixa a música 10 dB enquanto
a voz fala** (ducking), descendo 0,15 s antes da fala e voltando em 0,5 s depois — mais devagar
do que desce, para a música não saltar em cima do fim da frase.

O ducking usa `dura`, a **duração real** de cada arquivo, que o gerador mede e grava de volta em
`falas.json`. Com a janela reservada (`cabe`, maior) o ducking de uma fala encostaria no da
seguinte — as falas distam 3,8 s e a janela é 3,2 s — e a música ficaria abafada o vídeo inteiro.
Com a duração real sobra ~1 s de música plena entre as frases.

## Se mudar um tempo

A ordem é sempre esta:

1. `remotion/src/vertical/temaVertical.ts` — os cortes das cenas
2. `remotion/src/vertical/falas.json` — quando cada fala entra e quanto espaço tem
3. `remotion/scripts/gerar-trilha.mjs` — as marcas `T` / `TROCAS` e a grelha do kick

Pular o passo 3 descola os efeitos da imagem.
