import type { Metadata } from "next";
import Link from "next/link";
import { TriangleAlert } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/lib/auth/routes";

export const metadata: Metadata = {
  title: "Não foi possível continuar · Velos Wallet",
};

const REASONS = {
  "link-invalido": {
    title: "Link expirado ou já usado",
    description:
      "Por segurança, cada link vale por tempo limitado e só pode ser usado uma vez. Peça um novo para continuar.",
  },
  google: {
    title: "Não foi possível entrar com o Google",
    description:
      "O acesso foi cancelado ou o Google não respondeu. Tente de novo ou entre com email e senha.",
  },
} as const;

type Reason = keyof typeof REASONS;

function isReason(value: string | undefined): value is Reason {
  return value !== undefined && value in REASONS;
}

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ motivo?: string }>;
}) {
  const { motivo } = await searchParams;
  const reason = isReason(motivo) ? REASONS[motivo] : REASONS["link-invalido"];

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-4 py-10">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="bg-destructive/10 text-destructive flex size-12 items-center justify-center rounded-full">
          <TriangleAlert aria-hidden className="size-6" />
        </span>
        <h1 className="text-xl font-semibold">{reason.title}</h1>
        <p className="text-muted-foreground text-sm">{reason.description}</p>
      </div>

      <div className="flex flex-col gap-2">
        <Link href={ROUTES.signIn} className={buttonVariants({ className: "h-11" })}>
          Voltar para entrar
        </Link>
        <Link
          href={ROUTES.forgotPassword}
          className={buttonVariants({ variant: "outline", className: "h-11" })}
        >
          Pedir um novo link de senha
        </Link>
      </div>
    </main>
  );
}
