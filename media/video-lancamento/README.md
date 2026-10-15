# Vídeo de lançamento — como mexer

O MP4 pronto é **`velos-wallet-lancamento.mp4`** (1920×1080, 30 fps, H.264, 26,0 s).

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

## Sem trilha sonora

O vídeo sai **sem áudio**: não existe no projeto nenhum arquivo de música com direitos de uso
verificados. Para acrescentar uma faixa própria:

```bash
ffmpeg -i velos-wallet-lancamento.mp4 -i musica.mp3 -c:v copy -c:a aac -b:a 192k -shortest com-audio.mp4
```
