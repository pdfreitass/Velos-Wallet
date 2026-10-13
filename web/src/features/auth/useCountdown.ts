import { useEffect, useState } from "react";

/**
 * Segundos que faltam até `deadline` (timestamp em ms), atualizados a cada segundo.
 * Devolve 0 sem prazo ou depois dele. A contagem é só para a tela: quem decide o fim do
 * bloqueio é a API.
 */
export function useCountdown(deadline: number | null): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (deadline === null) return;
    const tick = () => setNow(Date.now());
    const first = window.setTimeout(tick, 0); // prazo novo: atualiza já, sem esperar 1 s
    const timer = window.setInterval(tick, 1000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, [deadline]);

  if (deadline === null) return 0;
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}

/** 600 → "10:00" · 65 → "1:05" */
export function formatCountdown(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}
