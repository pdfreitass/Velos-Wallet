import { CloseSection } from "@/features/landing/CloseSection";
import { LandingFooter } from "@/features/landing/LandingFooter";
import { LandingHeader } from "@/features/landing/LandingHeader";
import { MobileCtaBar } from "@/features/landing/MobileCtaBar";
import { PrivacyBand } from "@/features/landing/PrivacyBand";
import { Story } from "@/features/landing/Story";

/**
 * Página inicial pública (spec 003). Visitante vê a página na hora; quem já está logado vai para
 * o painel (GuestOnly no router). Nada aqui chama serviço de terceiros (RN8): sem fonte externa,
 * sem imagem, sem rastreador.
 */
export function LandingPage() {
  return (
    <>
      <title>Velos Wallet · Seu dinheiro na direção certa</title>
      <LandingHeader />
      {/* clip (e não hidden): corta o que vaza dos cartões inclinados sem quebrar o sticky. */}
      <main className="overflow-x-clip">
        <Story />
        <PrivacyBand />
        <CloseSection />
      </main>
      <LandingFooter />
      <MobileCtaBar />
    </>
  );
}
