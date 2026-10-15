import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { Link, useNavigate } from "react-router";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import { useChangePassword } from "@/features/auth/api";
import { FormAlert } from "@/features/auth/components/FormAlert";
import { FormField } from "@/features/auth/components/FormField";
import { PasswordInput } from "@/features/auth/components/PasswordInput";
import { PasswordRequirements } from "@/features/auth/components/PasswordRequirements";
import { toAuthAlert, type AuthAlert } from "@/features/auth/errors";
import { applyServerFieldErrors } from "@/features/auth/form-errors";
import { ROUTES } from "@/lib/auth/routes";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validations/auth";

const linkClass = "font-medium text-foreground underline hover:text-primary";

const REQUIREMENTS_ID = "reset-password-requirements";

/**
 * Senha nova depois do link do email (H5).
 *
 * Quem chega aqui já tem sessão — a volta do link a criou. Mesmo assim a API só aceita com o
 * cookie de recuperação: se ele venceu ou a tela foi aberta direto, o erro manda pedir outro link.
 */
export function ResetPasswordForm() {
  const navigate = useNavigate();
  const changePassword = useChangePassword();
  const [alert, setAlert] = useState<AuthAlert | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitted },
  } = useForm<z.input<typeof resetPasswordSchema>, unknown, ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
    mode: "onTouched",
  });

  const password = useWatch({ control, name: "password" }) ?? "";

  const onSubmit = handleSubmit(async (values) => {
    setAlert(null);
    try {
      await changePassword.mutateAsync(values);
      navigate(ROUTES.home, { replace: true });
    } catch (error) {
      if (applyServerFieldErrors(error, ["password", "confirmPassword"], setError)) return;
      setAlert(toAuthAlert(error));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Criar nova senha</h1>
        <p className="text-muted-foreground">Escolha uma senha nova para entrar no Velos Wallet.</p>
      </div>

      {alert ? (
        <FormAlert message={alert.message}>
          <p>
            <Link to={ROUTES.forgotPassword} className={linkClass}>
              Pedir um novo link
            </Link>
          </p>
        </FormAlert>
      ) : null}

      <div className="space-y-5">
        <FormField
          id="password"
          label="Nova senha"
          error={errors.password?.message}
          describedBy={REQUIREMENTS_ID}
          footer={
            <PasswordRequirements
              id={REQUIREMENTS_ID}
              password={password}
              invalid={isSubmitted && errors.password !== undefined}
            />
          }
        >
          {(control) => <PasswordInput {...control} {...register("password")} autoComplete="new-password" />}
        </FormField>

        <FormField id="confirmPassword" label="Confirme a nova senha" error={errors.confirmPassword?.message}>
          {(control) => <PasswordInput {...control} {...register("confirmPassword")} autoComplete="new-password" />}
        </FormField>
      </div>

      <Button type="submit" className="h-11 w-full text-base" disabled={changePassword.isPending}>
        {changePassword.isPending ? (
          <>
            <LoaderCircle className="animate-spin" aria-hidden="true" />
            Salvando…
          </>
        ) : (
          "Salvar nova senha"
        )}
      </Button>
    </form>
  );
}
