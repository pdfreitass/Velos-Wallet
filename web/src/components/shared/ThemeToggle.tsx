import { useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "cn";

import { Button } from "@/components/ui/button";

/** `iconOnly`: só o ícone (cabeçalho da página inicial no celular), com o mesmo rótulo acessível. */
export function ThemeToggle({ iconOnly = false, className }: { iconOnly?: boolean; className?: string }) {
  // O tema real foi decidido pelo script inline do index.html; aqui só se lê.
  // Num SPA não há render no servidor, então dá para ler já no estado inicial.
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains("dark"),
  );

  function toggle() {
    const next = !isDark;
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // Modo privado ou storage bloqueado: o tema vale so para esta sessao.
    }
    setIsDark(next);
  }

  return (
    <Button
      variant="outline"
      size={iconOnly ? "icon" : "sm"}
      onClick={toggle}
      aria-label={isDark ? "Mudar para tema claro" : "Mudar para tema escuro"}
      className={cn(iconOnly && "size-10 [&_svg:not([class*='size-'])]:size-4.5", className)}
    >
      {isDark ? <Sun /> : <Moon />}
      {iconOnly ? null : isDark ? "Tema claro" : "Tema escuro"}
    </Button>
  );
}
