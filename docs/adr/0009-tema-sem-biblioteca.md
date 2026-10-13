# ADR 0009 — Tema claro/escuro por script inline, sem biblioteca

- **Status:** Aceita (o padrão sem preferência salva foi alterado pelo [ADR 0016](0016-verde-escuro-como-tema-padrao.md))
- **Data:** 2026-10-11
- **Etapa:** 1 — Setup

## Contexto

Tema escuro desde o início, sem "flash" do tema errado no primeiro carregamento. A troca é só uma classe `.dark` no `<html>`.

## Decisão

Um **script inline** no `<head>` de `app/layout.tsx` lê `localStorage["theme"]` (ou `prefers-color-scheme`) e aplica `.dark` **antes do primeiro paint**. O `ThemeToggle` escreve na mesma chave. `<html>` leva `suppressHydrationWarning`.

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| `next-themes` | Faz o mesmo com uma dependência a mais. |
| Tema só no client (`useEffect`) | Pisca o tema errado a cada carregamento. |

## Consequências

- **Positivas:** zero dependências e zero flash.
- **Negativas:** `ThemeToggle` começa com `isDark = false` até o `useEffect` ler a classe (o ícone pode trocar em 1 frame).
- **A DEFINIR:** opção "seguir o sistema" no toggle (hoje são só claro/escuro).
