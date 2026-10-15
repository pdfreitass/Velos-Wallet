import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, MailCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useSearchParams } from "react-router";
import type { z } from "zod";

import { cn } from "cn";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRequestPasswordReset } from "@/features/auth/api";
import { FormAlert } from "@/features/auth/components/FormAlert";
import { FormField } from "@/features/auth/components/FormField";
import { toAuthAlert, type AuthAlert } from "@/features/auth/errors";
import { applyServerFieldErrors } from "@/features/auth/form-errors";
import { ROUTES } from "@/lib/auth/routes";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validations/auth";

const linkClass = "font-medium text-foreground underline hover:text-primary";

/**
 * "Esqueci minha senha" (H5, RN6).
 *
 * A confirmação é NEUTRA de propósito (RN4): diz "se existir uma conta", nunca "enviamos para
 * você". Qualquer um dos dois textos revelaria quais emails têm conta no Velos.
 */
export function ForgotPasswordForm() {
  const [params] = useSearchParams();
  const requestReset = useRequestPasswordReset();
  const [alert, setAlert] = useState<AuthAlert | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  // Veio de /auth/confirm com link velho, já usado ou aberto em outro navegador.
  const linkExpired = params.get("erro") === "link";

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<z.input<typeof forgotPasswordSchema>, unknown, ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
    mode: "onTouched",
  });

  const onSubmit = handleSubmit(async (values) => {
    setAlert(null);
    try {
      await requestReset.mutateAsync(values);
      setSentTo(values.email);
    } catch (error) {
      if (applyServerFieldErrors(error, ["email"], setError)) return;
      setAlert(toAuthAlert(error));
    }
  });

  if (sentTo !== null) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <MailCheck className="size-8 text-primary" aria-hidden="true" />
          {/* Foco no título: o botão enviado some, e sem isto o leitor de tela não anuncia a troca. */}
          <h1 ref={(heading) => heading?.focus()} tabIndex={-1} className="text-3xl font-semibold tracking-tight outline-none">
            Confira seu email
          </h1>
        </div>

        <div className="space-y-4 text-muted-foreground">
          <p>
            Se existir uma conta para <span className="font-medium text-foreground">{sentTo}</span>, enviamos um link
            para criar uma senha nova.
          </p>
          <p>O link vale por tempo limitado e pode ser usado uma única vez.</p>
          <p>Não chegou? Veja a caixa de spam ou tente de novo em alguns minutos.</p>
        </div>

        <Link to={ROUTES.signIn} className={cn(buttonVariants(), "h-11 w-full text-base")}>
          Voltar para entrar
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Esqueci minha senha</h1>
        <p className="text-muted-foreground">
          Informe o email da sua conta e enviaremos um link para criar uma senha nova.
        </p>
      </div>

      {linkExpired ? (
        <FormAlert message="Este link não é mais válido.">
          <p>Links de redefinição valem por tempo limitado e só funcionam uma vez. Peça um novo abaixo.</p>
        </FormAlert>
      ) : null}

      {alert ? <FormAlert message={alert.message} /> : null}

      <FormField id="email" label="Email" error={errors.email?.message}>
        {(control) => (
          <Input
            {...control}
            {...register("email")}
            type="email"
            autoComplete="email"
            inputMode="email"
            className="h-11 text-base"
          />
        )}
      </FormField>

      <Button type="submit" className="h-11 w-full text-base" disabled={requestReset.isPending}>
        {requestReset.isPending ? (
          <>
            <LoaderCircle className="animate-spin" aria-hidden="true" />
            Enviando…
          </>
        ) : (
          "Enviar link de redefinição"
        )}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Lembrou a senha?{" "}
        <Link to={ROUTES.signIn} className={linkClass}>
          Entrar
        </Link>
      </p>
    </form>
  );
}
