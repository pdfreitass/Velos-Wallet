import { MonitorSmartphone, ShieldCheck } from "lucide-react";

import { VelosMark } from "@/components/brand/VelosMark";
import { AccountsSumExample } from "@/features/auth/components/AccountsSumExample";

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
 */
export function BrandPanel() {
  return (
    <aside className="theme-inverse sticky top-0 hidden h-dvh flex-col justify-between gap-10 overflow-y-auto border-r border-border bg-background px-12 py-10 text-foreground lg:flex xl:px-16">
      <div className="flex items-center gap-3">
        <VelosMark className="h-9 w-auto" />
        <span className="text-lg font-semibold tracking-tight">Velos Wallet</span>
      </div>

      <div className="max-w-md space-y-12">
        <p className="text-[clamp(2.5rem,3.6vw,3.5rem)] leading-[1.02] font-semibold tracking-[-0.035em] text-balance">
          Seu dinheiro na direção certa.
        </p>
        <AccountsSumExample />
      </div>

      <ul className="grid max-w-md gap-5 text-sm sm:grid-cols-2">
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
    </aside>
  );
}
