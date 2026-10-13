import { LockKeyhole } from "lucide-react";
import { Link } from "react-router";
import { cn } from "cn";

import { buttonVariants } from "@/components/ui/button";
import { formatCountdown } from "@/features/auth/useCountdown";
import { ROUTES } from "@/lib/auth/routes";

type LockedNoticeProps = { secondsLeft: number; onUseOtherEmail: () => void };

/**
 * Acesso bloqueado depois de 5 senhas erradas (spec 001, RN5, CA14). Diz o problema, o tempo que
 * falta e as saídas: redefinir a senha ou tentar outro email. O relógio visível muda a cada
 * segundo, mas o leitor de tela só ouve o aviso inteiro uma vez (minutos arredondados).
 */
export function LockedNotice({ secondsLeft, onUseOtherEmail }: LockedNoticeProps) {
  const minutes = Math.max(1, Math.ceil(secondsLeft / 60));

  return (
    <div role="alert" className="space-y-4 rounded-xl border border-destructive/40 bg-destructive/8 p-4">
      <div className="flex gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-destructive/12 text-destructive">
          <LockKeyhole className="size-5" aria-hidden="true" />
        </span>
        <div className="space-y-1">
          <p className="font-semibold">Acesso bloqueado por segurança</p>
          {/* Cor do texto, não muted: sobre o fundo rosado o muted dava 4.28:1 (o texto dá 11.46:1). */}
          <p className="text-sm">
            Foram 5 senhas erradas seguidas para este email. Tente de novo em{" "}
            <span className="font-semibold tabular-nums" aria-hidden="true">
              {formatCountdown(secondsLeft)}
            </span>
            <span className="sr-only">
              {minutes} {minutes === 1 ? "minuto" : "minutos"}
            </span>{" "}
            ou redefina sua senha.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Link to={ROUTES.forgotPassword} className={cn(buttonVariants(), "h-11 flex-1 text-base")}>
          Redefinir minha senha
        </Link>
        <button
          type="button"
          onClick={onUseOtherEmail}
          className={cn(buttonVariants({ variant: "outline" }), "h-11 flex-1 border-input text-base")}
        >
          Usar outro email
        </button>
      </div>
    </div>
  );
}
