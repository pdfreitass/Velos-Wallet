import { useSearchParams } from "react-router";

import { SignUpForm } from "@/features/auth/components/SignUpForm";
import { getSafeRedirect } from "@/lib/utils/redirect";

export function SignUpPage() {
  const [params] = useSearchParams();

  return (
    <>
      <title>Criar conta · Velos Wallet</title>
      <SignUpForm next={getSafeRedirect(params.get("next"))} />
    </>
  );
}
