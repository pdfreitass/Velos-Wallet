# ADR 0005 — Tailwind v4 + shadcn/ui sobre Base UI

- **Status:** Aceita
- **Data:** 2026-10-11
- **Etapa:** 1 — Setup

## Contexto

Precisamos de componentes acessíveis, tema claro/escuro e tokens de cor próprios com contraste controlado, sem construir um design system do zero.

## Decisão

- **Tailwind CSS v4**, configuração **CSS-first** em `src/app/globals.css` (sem `tailwind.config.js`).
- **shadcn/ui** (estilo `base-nova`), que hoje gera componentes sobre **`@base-ui/react`**, não Radix.
- Ícones `lucide-react`; `cn` do pacote `cn`, reexportado em `src/lib/utils.ts`.
- Cores de dinheiro só pelos tokens `--income`/`--expense`.

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| Tailwind v3 | Legado; o shadcn atual gera para v4. |
| MUI / Chakra | Mais pesado e mais difícil de personalizar com a identidade Velos. |
| CSS Modules puro | Teríamos de escrever todos os componentes acessíveis. |

## Consequências

- **Positivas:** componentes no repositório (editáveis), tokens únicos para os dois temas.
- **Atenção:** componentes de terceiros (ex.: 21st.dev) que assumem Radix podem precisar de ajuste.
- **Regra:** componentes em `components/ui/` são gerados pelo CLI; não editar à mão sem motivo.
