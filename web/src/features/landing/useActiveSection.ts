import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";

/**
 * Avisa qual seção ([data-section]) está cruzando o meio da tela, para o iPhone fixo do desktop
 * mostrar a tela daquela seção. No celular cada seção tem a própria tela, então não faz nada.
 */
export function useActiveSection(rootRef: RefObject<HTMLElement | null>, onChange: (section: string) => void) {
  const onChangeRef = useRef(onChange);
  useLayoutEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const desktop = window.matchMedia("(width >= 64rem)");
    const observer = new IntersectionObserver(
      (entries) => {
        if (!desktop.matches) return;
        for (const entry of entries) {
          const section = entry.target instanceof HTMLElement ? entry.target.dataset.section : undefined;
          if (entry.isIntersecting && section) onChangeRef.current(section);
        }
      },
      // Uma linha no meio da tela: só a seção que a cruza conta como ativa.
      { rootMargin: "-50% 0px -50% 0px" },
    );
    for (const section of root.querySelectorAll("[data-section]")) observer.observe(section);
    return () => observer.disconnect();
  }, [rootRef]);
}
