import { useState } from "react";
import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
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
      size="sm"
      onClick={toggle}
      aria-label={isDark ? "Mudar para tema claro" : "Mudar para tema escuro"}
    >
      {isDark ? <Sun /> : <Moon />}
      {isDark ? "Tema claro" : "Tema escuro"}
    </Button>
  );
}
