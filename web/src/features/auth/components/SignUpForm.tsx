import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { Link, useNavigate } from "react-router";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSignUp } from "@/features/auth/api";
import { FormAlert } from "@/features/auth/components/FormAlert";
import { FormField } from "@/features/auth/components/FormField";
import { GoogleSignIn } from "@/features/auth/components/GoogleSignIn";
import { PasswordInput } from "@/features/auth/components/PasswordInput";
import { PasswordRequirements } from "@/features/auth/components/PasswordRequirements";
import { toAuthAlert, type AuthAlert } from "@/features/auth/errors";
import { applyServerFieldErrors, withNext } from "@/features/auth/form-errors";
import { ROUTES } from "@/lib/auth/routes";
import { signUpSchema, type SignUpInput } from "@/lib/validations/auth";

const linkClass = "font-medium text-foreground underline hover:text-primary";
const fields = ["name", "email", "password", "confirmPassword"] as const;

export function SignUpForm({ next }: { next: string }) {
  const navigate = useNavigate();
  const signUp = useSignUp();
  const [alert, setAlert] = useState<AuthAlert | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors },
  } = useForm<z.input<typeof signUpSchema>, unknown, SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
    mode: "onTouched",
  });
  const password = useWatch({ control, name: "password" });

  const onSubmit = handleSubmit(async (values) => {
    setAlert(null);
    try {
      await signUp.mutateAsync(values);
      navigate(next, { replace: true });
    } catch (error) {
      if (!applyServerFieldErrors(error, fields, setError)) setAlert(toAuthAlert(error));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Criar conta</h1>
        <p className="text-muted-foreground">É grátis e leva menos de um minuto.</p>
      </div>

      {alert ? (
        <FormAlert message={alert.message}>
          {alert.code === "email_taken" ? (
            <p className="flex flex-wrap gap-x-4 gap-y-1">
              <Link to={withNext(ROUTES.signIn, next)} className={linkClass}>
                Entrar
              </Link>
              <Link to={ROUTES.forgotPassword} className={linkClass}>
                Esqueci minha senha
              </Link>
            </p>
          ) : null}
        </FormAlert>
      ) : null}

      <div className="space-y-5">
        <FormField id="name" label="Nome" error={errors.name?.message}>
          {(field) => <Input {...field} {...register("name")} autoComplete="name" className="h-11 text-base" />}
        </FormField>

        <FormField id="email" label="Email" error={errors.email?.message}>
          {(field) => (
            <Input
              {...field}
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
          describedBy="password-requirements"
          footer={
            <PasswordRequirements id="password-requirements" password={password} invalid={Boolean(errors.password)} />
          }
        >
          {(field) => <PasswordInput {...field} {...register("password")} autoComplete="new-password" />}
        </FormField>

        <FormField id="confirmPassword" label="Confirmar senha" error={errors.confirmPassword?.message}>
          {(field) => <PasswordInput {...field} {...register("confirmPassword")} autoComplete="new-password" />}
        </FormField>
      </div>

      <Button type="submit" className="h-11 w-full text-base" disabled={signUp.isPending}>
        {signUp.isPending ? (
          <>
            <LoaderCircle className="animate-spin" aria-hidden="true" />
            Criando sua conta…
          </>
        ) : (
          "Criar conta"
        )}
      </Button>

      <GoogleSignIn next={next} />

      <p className="text-center text-sm text-muted-foreground">
        Já tem conta?{" "}
        <Link to={withNext(ROUTES.signIn, next)} className={linkClass}>
          Entrar
        </Link>
      </p>
    </form>
  );
}
