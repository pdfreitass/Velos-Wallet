import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { Link, useNavigate } from "react-router";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useResendSignUpConfirmation, useSignIn } from "@/features/auth/api";
import { FormAlert } from "@/components/shared/FormAlert";
import { FormField } from "@/components/shared/FormField";
import { LockedNotice } from "@/features/auth/components/LockedNotice";
import { GoogleSignIn } from "@/features/auth/components/GoogleSignIn";
import { PasswordInput } from "@/features/auth/components/PasswordInput";
import { SignUpConfirmationNotice } from "@/features/auth/components/SignUpConfirmationNotice";
import { attemptsLeftOf, minutesLeftOf } from "@/features/auth/errors";
import { applyServerFieldErrors, toErrorAlert, type ErrorAlert } from "@/lib/api/errors";
import { withNext } from "@/features/auth/form-errors";
import { useCountdown } from "@/features/auth/useCountdown";
import { ROUTES } from "@/lib/auth/routes";
import { signInSchema, type SignInInput } from "@/lib/validations/auth";

const linkClass = "font-medium text-foreground underline hover:text-primary";

/** O bloqueio é por email normalizado (igual à API): maiúsculas e espaços não contam. */
const normalizeEmail = (email: string) => email.trim().toLowerCase();

type Lock = { email: string; until: number };

/** Chamado só no tratamento da resposta (evento), nunca durante o render. */
function lockFor(email: string, minutes: number): Lock {
  return { email: normalizeEmail(email), until: Date.now() + minutes * 60_000 };
}

export function SignInForm({ next }: { next: string }) {
  const navigate = useNavigate();
  const signIn = useSignIn();
  const resend = useResendSignUpConfirmation();
  const [alert, setAlert] = useState<ErrorAlert | null>(null);
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
  const [lock, setLock] = useState<Lock | null>(null);
  const [notConfirmedEmail, setNotConfirmedEmail] = useState<string | null>(null);
  const [resendAlert, setResendAlert] = useState<ErrorAlert | null>(null);
  const [resendSent, setResendSent] = useState(false);
  const secondsLeft = useCountdown(lock?.until ?? null);
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    setFocus,
    control,
    formState: { errors },
  } = useForm<z.input<typeof signInSchema>, unknown, SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
    mode: "onTouched",
  });

  // Bloqueado só enquanto o relógio corre e o email é o mesmo: outro email pode tentar (a API decide).
  const email = useWatch({ control, name: "email" });
  const isLocked = lock !== null && secondsLeft > 0 && normalizeEmail(email ?? "") === lock.email;

  const onSubmit = handleSubmit(async (values) => {
    setAlert(null);
    setAttemptsLeft(null);
    setNotConfirmedEmail(null);
    setResendAlert(null);
    setResendSent(false);
    try {
      await signIn.mutateAsync(values);
      navigate(next, { replace: true });
    } catch (error) {
      if (applyServerFieldErrors(error, ["email", "password"], setError)) return;
      const minutes = minutesLeftOf(error);
      if (minutes !== null) {
        setLock(lockFor(values.email, minutes));
        return;
      }
      const alertError = toErrorAlert(error);
      setAlert(alertError);
      setAttemptsLeft(attemptsLeftOf(error));
      if (alertError.code === "email_not_confirmed") {
        setNotConfirmedEmail(values.email);
      }
    }
  });

  const onResendConfirmation = async () => {
    if (notConfirmedEmail === null) return;
    setResendAlert(null);
    setResendSent(false);
    try {
      await resend.mutateAsync(notConfirmedEmail);
      setResendSent(true);
    } catch (error) {
      setResendAlert(toErrorAlert(error));
    }
  };

  function handleUseOtherEmail() {
    setLock(null);
    setValue("email", "");
    setValue("password", "");
    setFocus("email");
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Entrar</h1>
        <p className="text-muted-foreground">Entre para ver seu saldo e seus gastos.</p>
      </div>

      {/* Volta de /auth/confirmar-cadastro: email confirmado em outro navegador ou link inválido. */}
      <SignUpConfirmationNotice />

      {isLocked ? (
        <LockedNotice secondsLeft={secondsLeft} onUseOtherEmail={handleUseOtherEmail} />
      ) : alert?.code === "email_not_confirmed" && notConfirmedEmail !== null ? (
        <FormAlert message={alert.message}>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <Button
              type="button"
              className="h-11 text-base"
              onClick={onResendConfirmation}
              disabled={resend.isPending}
              aria-live="polite"
            >
              {resend.isPending ? (
                <>
                  <LoaderCircle className="animate-spin" aria-hidden="true" />
                  Enviando…
                </>
              ) : resendSent ? (
                "Enviado de novo!"
              ) : (
                "Reenviar email de confirmação"
              )}
            </Button>
            {resendSent ? (
              <span role="status">
                Enviamos outro link para {notConfirmedEmail}. Confira a caixa de entrada e o spam.
              </span>
            ) : null}
          </div>
          {resendAlert ? <p className="text-destructive">{resendAlert.message}</p> : null}
        </FormAlert>
      ) : alert ? (
        attemptsLeft !== null ? (
          <FormAlert message="Email ou senha incorretos.">
            <p className="font-semibold">
              Mais {attemptsLeft} {attemptsLeft === 1 ? "tentativa errada" : "tentativas erradas"} e o acesso fica
              bloqueado por 10 minutos.
            </p>
          </FormAlert>
        ) : (
          <FormAlert message={alert.message} />
        )
      ) : null}

      <div className="space-y-5">
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

        <FormField
          id="password"
          label="Senha"
          error={errors.password?.message}
          footer={
            <p className="text-right text-sm">
              <Link to={ROUTES.forgotPassword} className={linkClass}>
                Esqueci minha senha
              </Link>
            </p>
          }
        >
          {(control) => <PasswordInput {...control} {...register("password")} autoComplete="current-password" />}
        </FormField>
      </div>

      <Button type="submit" className="h-11 w-full text-base" disabled={signIn.isPending || isLocked}>
        {signIn.isPending ? (
          <>
            <LoaderCircle className="animate-spin" aria-hidden="true" />
            Entrando…
          </>
        ) : (
          "Entrar"
        )}
      </Button>

      <GoogleSignIn next={next} />

      <p className="text-center text-sm text-muted-foreground">
        Ainda não tem conta?{" "}
        <Link to={withNext(ROUTES.signUp, next)} className={linkClass}>
          Criar conta
        </Link>
      </p>
    </form>
  );
}
