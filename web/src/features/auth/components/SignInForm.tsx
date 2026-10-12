import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSignIn } from "@/features/auth/api";
import { FormAlert } from "@/features/auth/components/FormAlert";
import { FormField } from "@/features/auth/components/FormField";
import { GoogleSignIn } from "@/features/auth/components/GoogleSignIn";
import { PasswordInput } from "@/features/auth/components/PasswordInput";
import { toAuthAlert, type AuthAlert } from "@/features/auth/errors";
import { applyServerFieldErrors, withNext } from "@/features/auth/form-errors";
import { ROUTES } from "@/lib/auth/routes";
import { signInSchema, type SignInInput } from "@/lib/validations/auth";

const linkClass = "font-medium text-foreground underline hover:text-primary";

export function SignInForm({ next }: { next: string }) {
  const navigate = useNavigate();
  const signIn = useSignIn();
  const [alert, setAlert] = useState<AuthAlert | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<z.input<typeof signInSchema>, unknown, SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
    mode: "onTouched",
  });

  const onSubmit = handleSubmit(async (values) => {
    setAlert(null);
    try {
      await signIn.mutateAsync(values);
      navigate(next, { replace: true });
    } catch (error) {
      if (!applyServerFieldErrors(error, ["email", "password"], setError)) setAlert(toAuthAlert(error));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Entrar</h1>
        <p className="text-muted-foreground">Entre para ver seu saldo e seus gastos.</p>
      </div>

      {alert ? (
        <FormAlert message={alert.message}>
          {alert.code === "locked" ? (
            <Link to={ROUTES.forgotPassword} className={linkClass}>
              Redefinir minha senha
            </Link>
          ) : null}
        </FormAlert>
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

      <Button type="submit" className="h-11 w-full text-base" disabled={signIn.isPending}>
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
