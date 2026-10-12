import { useState } from "react";
import { MonitorSmartphone, ShieldCheck } from "lucide-react";
import { Link } from "react-router";

import { VelosMark } from "@/components/brand/VelosMark";
import { AppShowcase } from "@/features/showcase/AppShowcase";
import type { ScreenId } from "@/features/showcase/showcase-data";

const promises = [
  { icon: ShieldCheck, title: "Privado por padrão", text: "Só você vê seus dados." },
  {
    icon: MonitorSmartphone,
    title: "Sem loja de apps",
    text: "Use no navegador do celular ou do computador.",
  },
];

/**
 * Metade esquerda das telas de entrada no desktop. Usa SEMPRE o tema oposto ao da página
 * (.theme-inverse em globals.css): verde profundo com a página clara, off-white com a página
 * escura, como as duas versões do logo. Assim as duas metades nunca viram um fundo só.
 *
 * O iPhone é o mesmo da página inicial, compacto (spec 003, decisão 4): abre nas contas "se
 * somando" e dá para trocar de tela pelas abas.
 */
export function BrandPanel() {
  const [screen, setScreen] = useState<ScreenId>("accounts");

  return (
    <aside className="theme-inverse sticky top-0 hidden h-dvh flex-col gap-8 overflow-y-auto border-r border-border bg-background px-12 py-10 text-foreground lg:flex xl:px-16">
      <Link
        to="/"
        className="flex w-fit items-center gap-3 rounded-md focus-visible:ring-3 focus-visible:ring-ring/60 focus-visible:outline-none"
      >
        <VelosMark className="h-9 w-auto" />
        <span className="text-lg font-semibold tracking-tight">Velos Wallet</span>
      </Link>

      <p className="max-w-md text-[clamp(2.25rem,3.2vw,3.25rem)] leading-[1.02] font-semibold tracking-[-0.035em] text-balance">
        Seu dinheiro na direção certa.
      </p>

      <div className="mt-auto flex flex-col gap-8 xl:flex-row xl:items-end">
        <AppShowcase size="compact" screen={screen} onScreenChange={setScreen} intro />

        <ul className="grid gap-5 text-sm sm:grid-cols-2 xl:max-w-[13rem] xl:grid-cols-1 xl:pb-6">
          {promises.map((promise) => (
            <li key={promise.title} className="flex gap-3">
              {/* Verde vivo é só da marca e de dinheiro (CLAUDE.md): ícones no tom do texto. */}
              <promise.icon className="mt-0.5 size-5 shrink-0 text-foreground" aria-hidden="true" />
              <p>
                <span className="block font-medium">{promise.title}</span>
                <span className="text-muted-foreground">{promise.text}</span>
              </p>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
