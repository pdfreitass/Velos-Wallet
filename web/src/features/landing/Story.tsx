import { useRef, useState, useSyncExternalStore } from "react";

import { ConvergeWires } from "@/features/landing/ConvergeWires";
import { Hero } from "@/features/landing/Hero";
import { StorySteps } from "@/features/landing/StorySteps";
import { storySteps } from "@/features/landing/story-steps";
import { useActiveSection } from "@/features/landing/useActiveSection";
import { AppShowcase } from "@/features/showcase/AppShowcase";
import type { AccountId, ScreenId } from "@/features/showcase/showcase-data";

/** Quando o primeiro pulso dos fios chega ao iPhone, as contas começam a se somar. */
const INTRO_DELAY_MS = 1100;
/** Em repouso um fio fica aceso (como no esboço): a primeira dobra tem seu ponto de verde vivo
 *  mesmo com "reduzir movimento" ou no toque, antes de qualquer interação. */
const RESTING_ACCOUNT: AccountId = "savings";
/** Só no desktop: na grade 2×2 do celular o fio da Poupança passaria atrás do cartão de crédito. */
const desktopQuery = "(width >= 64rem)";
function subscribeDesktop(onChange: () => void) {
  const media = window.matchMedia(desktopQuery);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

/**
 * Primeira dobra + seções com UM iPhone. Desktop: grade de duas colunas; o aparelho ocupa a
 * coluna da direita em todas as linhas e fica fixo enquanto o texto rola. Celular: uma coluna
 * (frase e contas, depois o aparelho, depois as seções com a própria tela).
 */
export function Story() {
  const [screen, setScreen] = useState<ScreenId>("accounts");
  const [hovered, setHovered] = useState<AccountId | null>(null);
  const [sectionHighlight, setSectionHighlight] = useState<AccountId | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef(new Map<AccountId, HTMLElement>());

  useActiveSection(stageRef, (section) => {
    const step = storySteps.find((item) => item.id === section);
    setScreen(step ? step.id : "accounts");
    setSectionHighlight(step?.highlight ?? null);
  });

  const isDesktop = useSyncExternalStore(subscribeDesktop, () => window.matchMedia(desktopQuery).matches);
  const activeId = hovered ?? sectionHighlight ?? (isDesktop ? RESTING_ACCOUNT : null);

  function selectAccount(id: AccountId) {
    setScreen("accounts");
    setHovered(id);
  }

  return (
    <div
      ref={stageRef}
      className="relative mx-auto grid w-full max-w-[90rem] px-4 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)] lg:gap-x-12 lg:px-20"
    >
      <ConvergeWires stageRef={stageRef} heroRef={heroRef} phoneRef={phoneRef} cardRefs={cardRefs} activeId={activeId} />

      <Hero
        ref={heroRef}
        cardRefs={cardRefs}
        activeId={activeId}
        onCardHover={setHovered}
        onCardSelect={selectAccount}
      />

      <div className="relative z-10 flex justify-center pb-6 lg:col-start-2 lg:row-span-5 lg:row-start-1 lg:items-start lg:pb-24">
        <div className="phone-sticky">
          <AppShowcase
            size="hero"
            screen={screen}
            onScreenChange={setScreen}
            highlight={activeId}
            intro
            introDelayMs={INTRO_DELAY_MS}
            phoneRef={phoneRef}
            className="stage-phone"
          />
        </div>
      </div>

      <StorySteps />
    </div>
  );
}
