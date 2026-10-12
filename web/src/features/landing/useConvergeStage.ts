import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";

import { allAccounts, type AccountId } from "@/features/showcase/showcase-data";

export type Wire = { id: AccountId; d: string; endX: number; endY: number };

type StageRefs = {
  /** Contêiner do SVG: as coordenadas dos fios são relativas a ele. */
  stageRef: RefObject<HTMLElement | null>;
  heroRef: RefObject<HTMLElement | null>;
  phoneRef: RefObject<HTMLElement | null>;
  cardRefs: RefObject<Map<AccountId, HTMLElement>>;
};

/** Altura (fração do aparelho) de cada linha da tela de contas, até ela ser medida. */
const FALLBACK_ROW_FRACTIONS = [0.3, 0.37, 0.44, 0.56];
/** No celular os fios descem até o topo do aparelho, sem se cruzar (ordem da grade 2×2). */
const TOP_FRACTIONS = [0.3, 0.7, 0.42, 0.58];

const finePointer = "(pointer: fine) and (prefers-reduced-motion: no-preference) and (width >= 64rem)";

/**
 * Geometria dos fios "tudo converge" (spec 003): de cada cartão de conta até a linha da mesma
 * conta no iPhone (desktop) ou até o topo do aparelho (celular). Remede ao redimensionar, ao
 * rolar (no desktop o iPhone fica fixo e os cartões sobem) e a cada quadro da inclinação com o
 * mouse, que também é escrita aqui (--tilt-x/--tilt-y no estágio).
 */
export function useConvergeStage({ stageRef, heroRef, phoneRef, cardRefs }: StageRefs) {
  const [wires, setWires] = useState<Wire[]>([]);
  const [fade, setFade] = useState(1);
  const rowFractions = useRef(new Map<AccountId, number>());
  const lastKey = useRef("");

  const measure = useCallback(() => {
    const stage = stageRef.current;
    const hero = heroRef.current;
    const phone = phoneRef.current;
    if (!stage || !hero || !phone) return;

    const heroRect = hero.getBoundingClientRect();
    if (heroRect.bottom < 0) return; // a primeira dobra já saiu da tela: nada para desenhar

    const s = stage.getBoundingClientRect();
    const p = phone.getBoundingClientRect();
    for (const row of phone.querySelectorAll<HTMLElement>("[data-wire-target]")) {
      const r = row.getBoundingClientRect();
      rowFractions.current.set(row.dataset.wireTarget as AccountId, (r.top + r.height / 2 - p.top) / p.height);
    }

    let horizontal = false;
    const next: Wire[] = [];
    const starts: { id: AccountId; sx: number; sy: number; ex: number; ey: number }[] = [];
    allAccounts.forEach((account, index) => {
      const card = cardRefs.current.get(account.id);
      if (!card) return;
      const r = card.getBoundingClientRect();
      // A inclinação muda com a largura (metade no celular): lê a que está valendo.
      const angle = ((Number.parseFloat(getComputedStyle(card).rotate) || 0) * Math.PI) / 180;
      const cx = r.left + r.width / 2 - s.left;
      const cy = r.top + r.height / 2 - s.top;

      if (r.right < p.left) {
        // Desktop: sai do meio da borda direita do cartão (já girado) e chega na linha da conta.
        horizontal = true;
        const half = card.offsetWidth / 2;
        const sx = cx + Math.cos(angle) * half;
        const sy = cy + Math.sin(angle) * half;
        const ex = p.left - s.left - 7;
        const ey = p.top - s.top + p.height * (rowFractions.current.get(account.id) ?? FALLBACK_ROW_FRACTIONS[index]);
        starts.push({ id: account.id, sx, sy, ex, ey });
      } else {
        // Celular: sai do meio da borda de baixo e desce até o topo do aparelho.
        const half = card.offsetHeight / 2;
        const sx = cx - Math.sin(angle) * half;
        const sy = cy + Math.cos(angle) * half;
        const ex = p.left - s.left + p.width * TOP_FRACTIONS[index];
        const ey = p.top - s.top - 7;
        const dy = ey - sy;
        next.push({ id: account.id, d: `M${sx} ${sy}C${sx} ${sy + dy * 0.55} ${ex} ${ey - dy * 0.45} ${ex} ${ey}`, endX: ex, endY: ey });
      }
    });

    // Desktop: todos os fios dobram na mesma faixa vertical (entre o cartão mais à direita e o
    // aparelho), como cabos num mesmo trilho. Com as alturas em ordem, nenhum cruza o outro.
    if (starts.length > 0) {
      const rightmost = Math.max(...starts.map((start) => start.sx));
      for (const { id, sx, sy, ex, ey } of starts) {
        const bend = rightmost + (ex - rightmost) * 0.5;
        next.push({ id, d: `M${sx} ${sy}C${bend} ${sy} ${bend} ${ey} ${ex} ${ey}`, endX: ex, endY: ey });
      }
    }

    // No desktop o iPhone acompanha a rolagem: os fios somem enquanto os cartões sobem (de 30%
    // a 70% da primeira dobra rolada). No celular o aparelho rola junto e os fios ficam.
    const scrolled = -heroRect.top / heroRect.height;
    const nextFade = horizontal ? Math.min(1, Math.max(0, 1 - (scrolled - 0.3) / 0.4)) : 1;
    const key = next.map((wire) => wire.d).join("|") + nextFade.toFixed(2);
    if (key === lastKey.current) return;
    lastKey.current = key;
    setWires(next);
    setFade(nextFade);
  }, [stageRef, heroRef, phoneRef, cardRefs]);

  // Primeira medida antes da pintura: os fios (e o pulso de abertura) nascem junto com a página.
  useLayoutEffect(measure, [measure]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    let frame = 0;
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(() => {
        frame = 0;
        measure();
      });
    };
    const resize = new ResizeObserver(schedule);
    resize.observe(stage);
    window.addEventListener("scroll", schedule, { passive: true });
    let disposed = false;
    void document.fonts?.ready.then(() => {
      if (!disposed) schedule();
    });

    // Inclinação com o mouse: aproxima o alvo aos poucos e remede os fios no mesmo quadro.
    const media = window.matchMedia(finePointer);
    const current = { x: 0, y: 0 };
    let goal = { x: 0, y: 0 };
    let tiltFrame = 0;
    const step = () => {
      current.x += (goal.x - current.x) * 0.1;
      current.y += (goal.y - current.y) * 0.1;
      stage.style.setProperty("--tilt-x", current.x.toFixed(4));
      stage.style.setProperty("--tilt-y", current.y.toFixed(4));
      measure();
      const settled = Math.abs(goal.x - current.x) < 0.002 && Math.abs(goal.y - current.y) < 0.002;
      tiltFrame = settled ? 0 : requestAnimationFrame(step);
    };
    const kick = () => {
      if (!tiltFrame) tiltFrame = requestAnimationFrame(step);
    };
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || !media.matches) return;
      goal = { x: (event.clientX / window.innerWidth) * 2 - 1, y: (event.clientY / window.innerHeight) * 2 - 1 };
      kick();
    };
    const onLeave = () => {
      goal = { x: 0, y: 0 };
      kick();
    };
    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerleave", onLeave);

    return () => {
      disposed = true;
      resize.disconnect();
      window.removeEventListener("scroll", schedule);
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(frame);
      cancelAnimationFrame(tiltFrame);
      stage.style.removeProperty("--tilt-x");
      stage.style.removeProperty("--tilt-y");
    };
  }, [stageRef, measure]);

  return { wires, fade };
}
