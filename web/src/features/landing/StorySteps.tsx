import type { ReactNode } from "react";
import { cn } from "cn";

import { CardArtifact, CategoryArtifacts, GoalArtifact, MonthArtifacts } from "@/features/landing/StepArtifacts";
import { storySteps } from "@/features/landing/story-steps";
import { AppShowcase } from "@/features/showcase/AppShowcase";
import type { ScreenId } from "@/features/showcase/showcase-data";

/** Cartões ao lado do texto. No celular só o do cartão aparece; as outras seções mostram a tela. */
const artifacts: Partial<Record<ScreenId, ReactNode>> = {
  accounts: <CardArtifact />,
  month: <MonthArtifacts />,
  categories: <CategoryArtifacts />,
  goals: <GoalArtifact />,
};

/**
 * As seções abaixo da primeira dobra. No desktop o texto rola à esquerda enquanto o iPhone fica
 * fixo à direita e troca de tela (useActiveSection); no celular cada seção traz o aparelho
 * cortado, mostrando a tela dela.
 */
export function StorySteps() {
  return storySteps.map((step) => (
    <section
      key={step.id}
      data-section={step.id}
      aria-labelledby={`step-${step.id}`}
      className="flex flex-col justify-center py-14 lg:col-start-1 lg:min-h-[78svh] lg:py-20"
    >
      <div className="max-w-[32rem]">
        <h2
          id={`step-${step.id}`}
          className="text-[clamp(2rem,3.4vw,3rem)] leading-[1.05] font-semibold tracking-[-0.03em] text-balance"
        >
          {step.title}
        </h2>
        <p className="mt-4 text-lg text-pretty text-muted-foreground">{step.text}</p>
      </div>

      {artifacts[step.id] ? (
        <div className={cn("mt-12", step.id !== "accounts" && "hidden lg:block")}>{artifacts[step.id]}</div>
      ) : null}

      {/* No celular, a seção do cartão mostra só o cartão: a tela de contas acabou de aparecer. */}
      {step.id === "accounts" ? null : (
        <div className="mt-10 flex justify-center lg:hidden">
          <AppShowcase size="peek" screen={step.id} highlight={step.highlight} />
        </div>
      )}
    </section>
  ));
}
