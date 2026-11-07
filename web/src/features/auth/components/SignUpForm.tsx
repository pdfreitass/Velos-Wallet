import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, MailCheck } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { Link, useNavigate } from "react-router";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchCurrentUser, useResendSignUpConfirmation, useSignUp } from "@/features/auth/api";
import { FormAlert } from "@/components/shared/FormAlert";
import { FormField } from "@/components/shared/FormField";
import { GoogleSignIn } from "@/features/auth/components/GoogleSignIn";
import { PasswordInput } from "@/features/auth/components/PasswordInput";
import { PasswordRequirements } from "@/features/auth/components/PasswordRequirements";
import { applyServerFieldErrors, toErrorAlert, type ErrorAlert } from "@/lib/api/errors";
import { withNext } from "@/features/auth/form-errors";
import { ROUTES } from "@/lib/auth/routes";
import { signUpSchema, type SignUpInput } from "@/lib/validations/auth";

const linkClass = "font-medium text-foreground underline hover:text-primary";
const fields = ["name", "email", "password", "confirmPassword"] as const;

/**
 * Cadastro (H1 da spec 001 + spec 013). A API responde 201 nos dois casos: sessão criada na hora
 * (confirmação desligada, ex.: dev) ou conta pendente de confirmação — quem decide é o /api/me
 * logo depois. Pendente: a própria página vira o estado de sucesso, com o email digitado, o aviso
 * de spam e o botão de reenviar (RN4).
 */
export function SignUpForm({ next }: { next: string }) {
  const navigate = useNavigate();
  const signUp = useSignUp();
  const resend = useResendSignUpConfirmation();
  const [alert, setAlert] = useState<ErrorAlert | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [resendAlert, setResendAlert] = useState<ErrorAlert | null>(null);
  const [resendSent, setResendSent] = useState(false);
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

      // Sessão criada (confirmação desligada) ou pendente? Só o /api/me diz: o cookie httpOnly
      // não é visível daqui (RN6 da spec 013).
      const current = await fetchCurrentUser();
      if (current === "unauthenticated") {
        setSentTo(values.email);
        return;
      }

      navigate(next, { replace: true });
    } catch (error) {
      if (!applyServerFieldErrors(error, fields, setError)) setAlert(toErrorAlert(error));
    }
  });

  const onResend = async () => {
    if (sentTo === null) return;
    setResendAlert(null);
    setResendSent(false);
    try {
      await resend.mutateAsync(sentTo);
      setResendSent(true);
    } catch (error) {
      setResendAlert(toErrorAlert(error));
    }
  };

  if (sentTo !== null) {
    return (
      // role="status" anuncia a troca de tela ao leitor de tela; o foco no título é reforço.
      <div role="status" className="space-y-6">
        <div className="space-y-2">
          <MailCheck className="size-8 text-primary" aria-hidden="true" />
          <h1 ref={(heading) => heading?.focus()} tabIndex={-1} className="text-3xl font-semibold tracking-tight outline-none">
            Confira seu email
          </h1>
        </div>

        <div className="space-y-4 text-muted-foreground">
          <p>
            Enviamos um link de confirmação para{" "}
            <span className="font-medium text-foreground">{sentTo}</span>.
          </p>
          <p>O link vale por tempo limitado e pode ser usado uma única vez.</p>
          <p>Não chegou? Veja a caixa de spam ou peça um novo abaixo.</p>
        </div>

        {resendAlert ? <FormAlert message={resendAlert.message} /> : null}

        <Button
          type="button"
          className="h-11 w-full text-base"
          onClick={onResend}
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
            "Reenviar email"
          )}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Já confirmou?{" "}
          <Link to={withNext(ROUTES.signIn, next)} className={linkClass}>
            Entrar
          </Link>
        </p>
      </div>
    );
  }

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
