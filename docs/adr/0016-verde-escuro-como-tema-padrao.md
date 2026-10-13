# ADR 0016 — Verde escuro como tema padrão

- **Status:** Aceita
- **Data:** 2026-10-12
- **Etapa:** Página inicial (spec 003)
- **Altera:** [ADR 0009](0009-tema-sem-biblioteca.md) (só a escolha sem preferência salva)

## Contexto

Até aqui, quem abria o app sem ter escolhido um tema recebia o tema do sistema (`prefers-color-scheme`). Ao revisar a página inicial, o Pedro achou o projeto "melhor e mais agradável" no verde escuro, que é a cor da marca (`#0A2E24`), e o branco do tema claro estava "estourando" perto do verde.

## Decisão

- Sem escolha guardada em `localStorage["theme"]`, o app abre no **tema escuro (verde profundo)**. O script inline do `index.html` continua aplicando o tema antes do primeiro paint (ADR 0009); só muda o padrão.
- A escolha do visitante no `ThemeToggle` continua valendo e é guardada como antes.
- A cor da barra do navegador (`theme-color`) passa a seguir o tema aplicado, não o do sistema.

Decisões de cor tomadas junto (spec 003, revisão do Pedro):
- A tela do iPhone da vitrine usa sempre o tema **oposto** ao da página (`.theme-inverse`), para o aparelho nunca se misturar com o fundo. No painel das telas de entrada, que já é invertido, a tela volta ao tema da página (`.theme-base`).
- No tema claro, o fundo desce de `#F4F7F2` para `#ECF1EA` e o `--card` deixa de ser `#FFFFFF` e passa a `#F5F8F3`; os tons de texto escurecem o necessário para seguir ≥ 4,5:1 (contrastes remedidos em `globals.css`).

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| Continuar seguindo o sistema | A maioria dos aparelhos está no claro, e a marca aparece melhor no verde escuro. |
| Só o tema escuro, sem alternância | O tema claro já existe, passou em todos os contrastes e é preferência de parte das pessoas. |

## Consequências

- **Positivas:** a primeira impressão é a da marca; o tema claro continua a um toque.
- **Negativas:** quem usa o sistema no claro vê o app escuro até trocar. Se a validação mostrar rejeição, volta a seguir o sistema (é uma linha no `index.html`).
