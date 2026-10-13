import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { Link, useNavigate } from "react-router";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSignIn } from "@/features/auth/api";
import { FormAlert } from "@/features/auth/components/FormAlert";
import { FormField } from "@/features/auth/components/FormField";
import { LockedNotice } from "@/features/auth/components/LockedNotice";
import { GoogleSignIn } from "@/features/auth/components/GoogleSignIn";
import { PasswordInput } from "@/features/auth/components/PasswordInput";
import { attemptsLeftOf, minutesLeftOf, toAuthAlert, type AuthAlert } from "@/features/auth/errors";
import { applyServerFieldErrors, withNext } from "@/features/auth/form-errors";
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
  const [alert, setAlert] = useState<AuthAlert | null>(null);
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
  const [lock, setLock] = useState<Lock | null>(null);
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
      setAlert(toAuthAlert(error));
      setAttemptsLeft(attemptsLeftOf(error));
    }
  });

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

      {isLocked ? (
        <LockedNotice secondsLeft={secondsLeft} onUseOtherEmail={handleUseOtherEmail} />
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
