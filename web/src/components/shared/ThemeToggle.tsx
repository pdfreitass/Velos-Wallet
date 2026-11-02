import { useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "cn";

import { Button } from "@/components/ui/button";

type ThemeToggleProps = { iconOnly?: boolean; ghost?: boolean; className?: string };

/**
 * `iconOnly`: só o ícone (cabeçalho no celular), com o mesmo rótulo acessível.
 * `ghost`: sem moldura, como os outros itens da casca do app logado.
 */
export function ThemeToggle({ iconOnly = false, ghost = false, className }: ThemeToggleProps) {
  // O tema real foi decidido pelo script inline do index.html; aqui só se lê.
  // Num SPA não há render no servidor, então dá para ler já no estado inicial.
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains("dark"),
  );

  function toggle() {
    const next = !isDark;
    document.documentElement.classList.toggle("dark", next);
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", next ? "#0A2E24" : "#ECF1EA");
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // Modo privado ou storage bloqueado: o tema vale so para esta sessao.
    }
    setIsDark(next);
  }

  return (
    <Button
      variant={ghost ? "ghost" : "outline"}
      size={iconOnly ? "icon" : "sm"}
      onClick={toggle}
      aria-label={isDark ? "Mudar para tema claro" : "Mudar para tema escuro"}
      className={cn(iconOnly && "[&_svg:not([class*='size-'])]:size-4.5", className)}
    >
      {isDark ? <Sun /> : <Moon />}
      {iconOnly ? null : isDark ? "Tema claro" : "Tema escuro"}
    </Button>
  );
}
