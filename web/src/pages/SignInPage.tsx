import { useSearchParams } from "react-router";

import { SignInForm } from "@/features/auth/components/SignInForm";
import { getSafeRedirect } from "@/lib/utils/redirect";

export function SignInPage() {
  const [params] = useSearchParams();

  return (
    <>
      <title>Entrar · Velos Wallet</title>
      <SignInForm next={getSafeRedirect(params.get("next"))} />
    </>
  );
}
