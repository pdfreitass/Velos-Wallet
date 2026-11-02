# Vídeo de lançamento — como mexer

São **dois** vídeos, da mesma história e do mesmo projeto Remotion:

| Arquivo | Formato | Duração | Para onde |
|---|---|---|---|
| `velos-wallet-lancamento.mp4` | 1920×1080 (16:9), sem áudio | 26,0 s | site, YouTube, apresentação |
| `velos-wallet-reels.mp4` | 1080×1920 (9:16), **trilha + efeitos + locução** | 28,8 s | Instagram Reels, TikTok |

Feito com [Remotion](https://www.remotion.dev), renderizado **localmente**. Nada aqui usa API
paga, serviço de renderização na nuvem nem créditos do Motion.

## Licença

Remotion é gratuito para **indivíduos** e empresas com até 3 funcionários, inclusive para uso
comercial ([LICENSE.md](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md)). Como o
Velos é de uma pessoa, o uso cai na Free License e não exige Company License. Se um dia virar
empresa com mais de 3 funcionários, é preciso comprar a licença em remotion.pro.

## Reproduzir

```bash
start "" "velos-wallet-lancamento.mp4"
```

## Editar e ver ao vivo

Abre o Remotion Studio no navegador, com recarga a cada alteração:

```bash
npm run preview --prefix remotion
```

## Renderizar de novo

```bash
npm run render --prefix remotion
```

Grava por cima de `velos-wallet-lancamento.mp4`. O comando completo está em
`remotion/package.json` (`--codec=h264 --crf=16 --pixel-format=yuv420p`).

Depois do render, o arquivo é normalizado para publicação (faixa de cor `tv`, BT.709 e
`+faststart`, que as redes sociais esperam):

```bash
ffmpeg -y -i velos-wallet-lancamento.mp4 -c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p -color_range tv -colorspace bt709 -color_primaries bt709 -color_trc bt709 -movflags +faststart -an saida.mp4
```

## Estrutura

| Caminho | O que é |
|---|---|
| `velos-wallet-lancamento.mp4` | **o vídeo final** |
| `remotion/src/Lancamento.tsx` | a linha do tempo: cinco blocos, nos tempos do ROTEIRO.md |
| `remotion/src/scenes/` | uma cena por arquivo (Abertura, ToqueIcone, Vitrine, Entrar, Fecho) |
| `remotion/src/theme.ts` | cores e tempos, copiados de `web/src/styles/globals.css` |
| `remotion/public/shots/` | cópias das capturas usadas no vídeo |
| `remotion/public/fonts/geist.woff2` | a Geist, embutida para render offline |
| `_validacao/` | fotogramas de referência usados para conferir a sequência |

Ficam **fora do Git** (só no disco, ver `.gitignore`): o MP4, `_validacao/` e as capturas
`*.png` desta pasta. O render depende só do que está em `remotion/public/`, que é versionado.

O projeto em `remotion/` é isolado: não é referenciado por `web/` nem por `api/` e não altera
nada da aplicação.

## A versão vertical (Reels / TikTok)

Renderizar:

```bash
npm run render:reels --prefix remotion
```

Gera `velos-wallet-reels.mp4` (1080×1920, 30 fps, H.264 + AAC 192k, 28,8 s).

**Antes do primeiro render**, gerar o áudio — sem os arquivos de voz o render falha:

```bash
npm run audio --prefix remotion   # trilha + locução de rascunho
```

Depois do render, normalizar para publicação — BT.709 completo e `+faststart`, que o Instagram
espera (sem isto o `color_primaries` fica `unknown` e algumas telas lavam a cor):

```bash
ffmpeg -y -i velos-wallet-reels.mp4 -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p -color_range tv -colorspace bt709 -color_primaries bt709 -color_trc bt709 -c:a aac -b:a 192k -ar 48000 -movflags +faststart saida.mp4
ffmpeg -y -i saida.mp4 -c copy -bsf:v "h264_metadata=video_full_range_flag=0:colour_primaries=1:transfer_characteristics=1:matrix_coefficients=1" -movflags +faststart velos-wallet-reels.mp4
```

Não é o vídeo 16:9 reescalado: as cenas foram **recompostas**. No 16:9 o texto fica à esquerda e
o aparelho à direita; na vertical o texto sobe para o terço superior e o aparelho ocupa o centro.
Nada legível desce abaixo de ~1500 px, que é onde a interface do Instagram cobre a tela com
legenda, perfil e botões.

| Caminho | O que é |
|---|---|
| `remotion/src/vertical/Reels.tsx` | a linha do tempo vertical |
| `remotion/src/vertical/temaVertical.ts` | cortes, margens e zonas seguras do Reels |
| `remotion/src/vertical/*V.tsx` | uma cena por arquivo, sufixo `V` de vertical |
| `remotion/src/vertical/tela/` | as telas do app **desenhadas em código** |
| `remotion/src/vertical/falas.json` | os tempos da locução, lidos pelo vídeo e pelo gerador |
| `LOCUCAO.md` | o roteiro falado e como gerar a voz |

As cenas 16:9 em `remotion/src/scenes/` **não foram tocadas** — os dois formatos convivem.

### Por que as telas são código, e não capturas

O 16:9 mostra PNGs das telas. Serve para ele, mas num vídeo vertical de rede social isso tem um
teto: a imagem é achatada, então **nada se move dentro do aparelho** — nenhum número conta,
nenhuma barra cresce, nenhuma fatia da rosca se desenha. O aparelho vira uma fotografia que faz
fusão com a seguinte.

Na versão vertical as quatro telas são componentes (`src/vertical/tela/Telas.tsx`), portados de
`web/src/features/showcase/screens/`, com os mesmos dados em centavos. Por isso:

- o saldo conta de 0 até R$ 10.650,45;
- as barras de entradas/saídas e as três metas crescem;
- a rosca de gastos se desenha fatia a fatia, como um relógio;
- cada linha das listas entra escalonada.

Os ícones vêm de `tela/Icone.tsx`, extraídos uma vez do `lucide-react` que o app já usa (ISC) —
o projeto de vídeo não ganhou dependência nova por causa disso. O `globals.css` do `web/`
**não** é importado: ele depende de `tw-animate-css`, de `shadcn/tailwind.css` e de custom
variants, e arrastar isso para o render seria frágil. Os tokens estão repetidos em
`tela/tokensTela.ts`, com as mesmas cores.

Se uma tela mudar no app, `tela/dados.ts` e `tela/Telas.tsx` precisam acompanhar.

## A trilha e os efeitos

Tudo é **sintetizado pelo próprio projeto**, amostra a amostra, em
`remotion/scripts/gerar-trilha.mjs` (com os blocos de síntese em `scripts/sintese.mjs`). Não há
sample, loop comprado nem faixa de terceiro: o áudio é tão livre quanto o resto, e não há risco
de reivindicação de direitos no Instagram.

```bash
npm run trilha --prefix remotion   # regrava remotion/public/audio/trilha.wav
```

**Música.** Progressão Am–F–C–G com pad, baixo, kick, hi-hat e arpejo. A dinâmica segue o
roteiro, e isso é medido, não sentido:

| Trecho | RMS |
|---|---|
| abertura | −25,7 dB |
| toque no ícone | −18,4 dB |
| vitrine | ~−19,5 dB |
| privacidade | −25,0 dB (recua, para a frase respirar) |
| fecho | −16,8 dB (o ponto mais alto) |
| cauda | −27,2 dB |

**Efeitos.** Cada som existe porque há movimento na imagem naquele instante — é isso que faz o
áudio parecer colado na animação em vez de tocar por cima dela: clique no toque do ícone, whoosh
a cada deslize de tela, grãos acompanhando a desaceleração dos números, varredura nas barras que
crescem, tom subindo enquanto a rosca se desenha, e o acorde do botão no fecho.

**Grelha.** Offset de 0,2 s e batida de 0,4 s (150 bpm), escolhidos para que as trocas de tela —
5,0 · 8,2 · 11,4 · 14,6 s — caiam todas em cima de um kick. Se os tempos das cenas mudarem em
`temaVertical.ts`, as marcas em `T` e `TROCAS` do gerador têm de mudar junto.

Pico em −3 dBFS, para sobrar margem na recompressão do Instagram.

Para trocar por uma música própria, substituir `remotion/public/audio/trilha.wav` (ou apontar o
`<Audio>` de `Reels.tsx` para outro arquivo) e renderizar de novo. Vale manter os efeitos: nesse
caso, gerar só eles e misturar com a faixa nova.

O vídeo 16:9 continua **sem áudio**, de propósito: ele é usado em contextos onde a trilha atrapalha.
