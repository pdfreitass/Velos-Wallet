/**
 * Gera as faixas de voz em `remotion/public/audio/voz/NN.wav`, a partir de `locucao.mjs`.
 *
 *   node scripts/gerar-locucao.mjs --motor kokoro --voz pf_dora   (voz de IA, Apache-2.0)
 *   node scripts/gerar-locucao.mjs --motor windows
 *   node scripts/gerar-locucao.mjs --motor gravacao      (suas próprias gravações)
 *   node scripts/gerar-locucao.mjs --motor voicestudio --voz <profile_id>
 *   node scripts/gerar-locucao.mjs --motor voicestudio --listar-vozes
 *   node scripts/gerar-locucao.mjs --motor elevenlabs --voz <voice_id>
 *
 * `windows` usa a voz Microsoft Maria (pt-BR) que já existe no sistema: é robótica e serve só
 * como rascunho para conferir se cada fala cabe no seu espaço antes de gastar crédito.
 *
 * `voicestudio` fala com o VoiceStudio rodando na própria máquina (padrão
 * `http://localhost:3900`, mude com `--url`). É local, gratuito e não precisa de chave. A
 * aplicação tem de estar aberta e com um modelo em português instalado.
 *   Licenças: o VoiceStudio é AGPL-3.0 e permite uso comercial da aplicação, mas **os pesos de
 *   cada modelo têm termos próprios** e alguns são "research / non-commercial". Como este vídeo
 *   é peça de divulgação, escolha um modelo cujos termos permitam uso comercial.
 *
 * `elevenlabs` lê a chave de `ELEVENLABS_API_KEY` — a chave nunca é escrita em arquivo nem
 * impressa, aqui ou em qualquer log.
 *
 * No fim o script mede cada faixa e avisa quando uma passa do tempo disponível.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { FALAS } from "./locucao.mjs";

const AQUI = dirname(fileURLToPath(import.meta.url));
const DESTINO = join(AQUI, "..", "public", "audio", "voz");

function argumento(nome, padrao) {
  const i = process.argv.indexOf(`--${nome}`);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : padrao;
}

const motor = argumento("motor", "windows");
const voz = argumento("voz", null);
const taxaFala = Number(argumento("velocidade", "0")); // SAPI: -10 a 10
const urlVoiceStudio = argumento("url", "http://localhost:3900").replace(/\/$/, "");
const listarVozes = process.argv.includes("--listar-vozes");
const engineAlvo = argumento("engine", null);
const velocidadeKokoro = Number(argumento("ritmo", "1.0"));
const pastaGravacoes = argumento("de", join(AQUI, "..", "..", "gravacoes"));

mkdirSync(DESTINO, { recursive: true });

/** Voz do sistema, via SAPI. Sem rede, sem chave, sem custo. */
function gerarWindows(fala, saida) {
  // O texto vai como argumento separado, nunca interpolado no script: assim nenhum caractere
  // do roteiro pode ser lido como código pelo PowerShell.
  const ps = `
    param([string]$Texto, [string]$Saida, [int]$Taxa)
    Add-Type -AssemblyName System.Speech
    $s = New-Object System.Speech.Synthesis.SpeechSynthesizer
    $pt = $s.GetInstalledVoices() | Where-Object { $_.VoiceInfo.Culture.Name -eq 'pt-BR' } | Select-Object -First 1
    if ($null -eq $pt) { Write-Error 'Nenhuma voz pt-BR instalada no Windows'; exit 1 }
    $s.SelectVoice($pt.VoiceInfo.Name)
    $s.Rate = $Taxa
    $s.SetOutputToWaveFile($Saida)
    $s.Speak($Texto)
    $s.Dispose()
  `;
  const arquivoPs = join(DESTINO, "_falar.ps1");
  writeFileSync(arquivoPs, ps, "utf8");
  execFileSync(
    "powershell",
    ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", arquivoPs, "-Texto", fala.texto, "-Saida", saida, "-Taxa", String(taxaFala)],
    { stdio: ["ignore", "ignore", "inherit"] },
  );
}

/**
 * Gravações feitas pelo próprio Pedro — celular serve.
 *
 * Procura `01`…`07` em `media/video-lancamento/gravacoes/` com qualquer extensão de áudio que o
 * ffmpeg leia (m4a, mp3, wav, ogg, opus…). Converte, corta o silêncio das pontas e nivela como
 * os outros motores, então uma gravação torta de celular já entra no vídeo em pé de igualdade.
 */
function gerarDeGravacao(fala, saida) {
  const extensoes = ["wav", "m4a", "mp3", "ogg", "opus", "aac", "flac", "mp4", "webm"];
  const origem = extensoes
    .map((ext) => join(pastaGravacoes, `${fala.id}.${ext}`))
    .find((caminho) => existsSync(caminho));

  if (!origem) {
    throw new Error(
      `Falta a gravação da fala ${fala.id} ("${fala.texto}").\n` +
        `Grave e salve como ${fala.id}.m4a (ou .wav/.mp3) em:\n  ${pastaGravacoes}`,
    );
  }

  // silenceremove nas duas pontas: tira o clique de começar e parar a gravação
  execFileSync("ffmpeg", [
    "-y", "-v", "error", "-i", origem,
    "-af",
      "silenceremove=start_periods=1:start_duration=0.05:start_threshold=-45dB:" +
      "stop_periods=-1:stop_duration=0.25:stop_threshold=-45dB",
    "-ar", "48000", "-ac", "1", saida,
  ]);
}

/**
 * Kokoro-82M, local, via ONNX. É o motor de IA que usamos para a locução final.
 *
 * Por que este e não o VoiceStudio: o Kokoro é **Apache-2.0** e não é gated — não exige aceitar
 * licença nenhuma, o que importa porque este vídeo é peça comercial. O modelo é um arquivo ONNX
 * (dados), não um repositório de terceiros que precise ser clonado e executado.
 *
 * Gera todas as falas numa chamada só: carregar o modelo custa ~10 s e não faz sentido pagar
 * isso sete vezes.
 */
function gerarKokoroTodas() {
  const base = "C:/Users/pedro/.local/kokoro-tts";
  const python = join(base, ".venv", "Scripts", "python.exe");
  if (!existsSync(python)) {
    throw new Error(
      `Kokoro não está instalado em ${base}.\n` +
        `Crie o ambiente com:  uv venv --python 3.12  &&  uv pip install kokoro-onnx soundfile\n` +
        `e baixe kokoro-v1.0.fp16.onnx e voices-v1.0.bin da release model-files-v1.1 de ` +
        `thewh1teagle/kokoro-onnx.`,
    );
  }
  const falasJson = join(AQUI, "..", "src", "vertical", "falas.json");
  execFileSync(
    python,
    [join(base, "gerar.py"), "--falas", falasJson, "--destino", DESTINO,
     "--voz", voz ?? "pf_dora", "--velocidade", String(velocidadeKokoro)],
    { stdio: ["ignore", "inherit", "pipe"] },
  );
}

/**
 * VoiceStudio rodando localmente. API compatível com a da OpenAI, em `/v1/audio/speech`.
 * Nada sai da máquina: nem o texto, nem o áudio.
 */
async function exigirVoiceStudioNoAr() {
  let saude;
  try {
    saude = await fetch(`${urlVoiceStudio}/health`);
  } catch {
    throw new Error(
      `VoiceStudio não respondeu em ${urlVoiceStudio}. Abra a aplicação e tente de novo ` +
        `(ou passe --url se ela estiver noutro endereço).`,
    );
  }
  if (!saude.ok) throw new Error(`VoiceStudio respondeu ${saude.status} em /health.`);
}

/**
 * Deixa ativo o engine pedido em `--engine`.
 *
 * Importa porque o padrão do VoiceStudio é o OmniVoice, cujos pesos exigem aceitar uma licença
 * na interface. Engines Apache-2.0 como o Confucius4-TTS não exigem nada e servem para peça
 * comercial — mas só valem se estiverem selecionados.
 */
async function selecionarEngine(engineId) {
  const resposta = await fetch(`${urlVoiceStudio}/engines/select`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ family: "tts", backend_id: engineId }),
  });
  if (!resposta.ok) {
    throw new Error(
      `Não foi possível ativar o engine '${engineId}' (${resposta.status}): ` +
        `${(await resposta.text()).slice(0, 200)}`,
    );
  }
  console.log(`engine ativo: ${engineId}`);
}

/** Mostra as vozes instaladas, para escolher um profile_id de verdade em vez de adivinhar. */
async function mostrarVozes() {
  await exigirVoiceStudioNoAr();
  const resposta = await fetch(`${urlVoiceStudio}/v1/audio/voices`);
  if (!resposta.ok) throw new Error(`/v1/audio/voices respondeu ${resposta.status}.`);
  const corpo = await resposta.json();
  const vozes = Array.isArray(corpo) ? corpo : (corpo.voices ?? corpo.data ?? []);
  if (vozes.length === 0) {
    console.log("Nenhuma voz instalada. Abra o Model Catalogue do VoiceStudio e instale um modelo em português.");
    return;
  }
  console.log(`\nvozes em ${urlVoiceStudio}:\n`);
  for (const v of vozes) {
    const id = v.id ?? v.voice_id ?? v.name;
    const extra = [v.engine, v.language ?? v.locale].filter(Boolean).join(" · ");
    console.log(`  ${String(id).padEnd(38)} ${extra}`);
  }
  console.log(`\nuse: npm run locucao:vs -- --voz <id>\n`);
}

async function gerarVoiceStudio(fala, saida) {
  if (!voz) throw new Error("Informe --voz <profile_id>. Para ver os ids: --listar-vozes.");

  const resposta = await fetch(`${urlVoiceStudio}/v1/audio/speech`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "tts-1",
      voice: voz,
      input: fala.texto,
      response_format: "wav",
      // o backend aceita a etiqueta de idioma; se o engine escolhido ignorar, não faz mal
      language: "pt-BR",
    }),
  });
  if (!resposta.ok) {
    const detalhe = (await resposta.text()).slice(0, 300);
    throw new Error(`VoiceStudio respondeu ${resposta.status} na fala ${fala.id}: ${detalhe}`);
  }

  const bruto = join(DESTINO, `_${fala.id}_vs.wav`);
  writeFileSync(bruto, Buffer.from(await resposta.arrayBuffer()));
  // Uma resposta de erro também chega com 200 em alguns caminhos: só é áudio se o ffprobe ler.
  try {
    duracao(bruto);
  } catch {
    rmSync(bruto, { force: true });
    throw new Error(`O que voltou para a fala ${fala.id} não é áudio válido.`);
  }
  execFileSync("ffmpeg", ["-y", "-v", "error", "-i", bruto, "-ar", "48000", "-ac", "1", saida]);
  rmSync(bruto, { force: true });
}

/** ElevenLabs. A chave sai do ambiente e não é registrada em lugar nenhum. */
async function gerarElevenLabs(fala, saida) {
  const chave = process.env.ELEVENLABS_API_KEY;
  if (!chave) throw new Error("Defina ELEVENLABS_API_KEY no ambiente (não commite a chave).");
  if (!voz) throw new Error("Informe --voz <voice_id>.");

  const resposta = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voz}`, {
    method: "POST",
    headers: { "xi-api-key": chave, "Content-Type": "application/json" },
    body: JSON.stringify({
      text: fala.texto,
      model_id: "eleven_multilingual_v2",
      voice_settings: { stability: 0.45, similarity_boost: 0.75, style: 0.15 },
    }),
  });
  if (!resposta.ok) {
    // a mensagem do serviço pode repetir cabeçalhos; só o código sobe
    throw new Error(`ElevenLabs respondeu ${resposta.status} para a fala ${fala.id}`);
  }
  const mp3 = join(DESTINO, `_${fala.id}.mp3`);
  writeFileSync(mp3, Buffer.from(await resposta.arrayBuffer()));
  // o Remotion lida melhor com WAV 48 kHz, igual à trilha
  execFileSync("ffmpeg", ["-y", "-v", "error", "-i", mp3, "-ar", "48000", "-ac", "1", saida]);
}

function duracao(arquivo) {
  const saida = execFileSync("ffprobe", [
    "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", arquivo,
  ]);
  return Number(String(saida).trim());
}

/**
 * Nivela a fala para −16 LUFS com teto em −1,5 dBTP.
 *
 * Sem isto a locução sai ~6 dB ABAIXO da música, e nem o ducking salva: a voz some. −16 LUFS é
 * o alvo que as redes sociais usam para fala, e deixa ~10 dB de folga sobre a música abaixada.
 */
function nivelar(arquivo) {
  const temporario = arquivo.replace(/\.wav$/, "_nv.wav");
  execFileSync("ffmpeg", [
    "-y", "-v", "error", "-i", arquivo,
    "-af", "loudnorm=I=-16:TP=-1.5:LRA=11",
    "-ar", "48000", "-ac", "1", temporario,
  ]);
  renameSync(temporario, arquivo);
}

// Falha de configuração é coisa do operador: merece uma linha legível, não um stack trace.
process.on("uncaughtException", (erro) => {
  console.error(`\n${erro.message}\n`);
  process.exit(1);
});

if (listarVozes) {
  await exigirVoiceStudioNoAr();
  if (engineAlvo) await selecionarEngine(engineAlvo);
  await mostrarVozes();
  process.exit(0);
}

if (motor === "kokoro") gerarKokoroTodas();

if (motor === "voicestudio") {
  await exigirVoiceStudioNoAr();
  if (engineAlvo) await selecionarEngine(engineAlvo);
}

const relatorio = [];
for (const fala of FALAS) {
  const saida = join(DESTINO, `${fala.id}.wav`);
  if (motor === "kokoro") {
    if (!existsSync(saida)) throw new Error(`O Kokoro não gerou a fala ${fala.id}.`);
  } else if (motor === "windows") gerarWindows(fala, saida);
  else if (motor === "gravacao") gerarDeGravacao(fala, saida);
  else if (motor === "voicestudio") await gerarVoiceStudio(fala, saida);
  else if (motor === "elevenlabs") await gerarElevenLabs(fala, saida);
  else throw new Error(`Motor desconhecido: ${motor}`);
  nivelar(saida);
  relatorio.push({ fala, segundos: duracao(saida) });
}

// Grava a duração medida de volta no JSON partilhado. O ducking do vídeo precisa dela para
// abaixar a música só enquanto a voz realmente fala: usando a janela reservada (`cabe`), que é
// maior, o ducking de uma fala encosta no da seguinte e a música fica abafada o vídeo inteiro.
const caminhoJson = join(AQUI, "..", "src", "vertical", "falas.json");
const json = JSON.parse(readFileSync(caminhoJson, "utf8"));
for (const { fala, segundos } of relatorio) {
  const alvo = json.falas.find((f) => f.id === fala.id);
  if (alvo) alvo.dura = Number(segundos.toFixed(2));
}
writeFileSync(caminhoJson, `${JSON.stringify(json, null, 2)}\n`, "utf8");

// limpa os intermediários: só os NN.wav interessam
rmSync(join(DESTINO, "_falar.ps1"), { force: true });
for (const fala of FALAS) rmSync(join(DESTINO, `_${fala.id}.mp3`), { force: true });

console.log(`\nmotor: ${motor}\n`);
let estourou = 0;
for (const { fala, segundos } of relatorio) {
  const folga = fala.cabe - segundos;
  const marca = folga < 0 ? "ESTOUROU" : folga < 0.25 ? "apertado" : "ok";
  if (folga < 0) estourou++;
  console.log(
    `${fala.id}  ${segundos.toFixed(2)}s de ${fala.cabe.toFixed(2)}s  ${marca.padEnd(9)} ${fala.texto}`,
  );
}

if (estourou > 0) {
  console.log(
    `\n${estourou} fala(s) não cabem. Encurte o texto em LOCUCAO.md, ou aumente "cabe" em ` +
      `locucao.mjs e mova o corte da cena em src/vertical/temaVertical.ts.`,
  );
  process.exitCode = 1;
} else {
  console.log("\ntodas as falas cabem.");
}
