import type { AccountId, ScreenId } from "@/features/showcase/showcase-data";

export type StoryStep = {
  /** A tela que o iPhone mostra quando a seção está no meio da tela. */
  id: ScreenId;
  title: string;
  text: string;
  /** Conta destacada no iPhone durante a seção. */
  highlight?: AccountId;
};

/** Seções abaixo da primeira dobra (spec 003, decisão 3). Só promete o que o MVP entrega. */
export const storySteps: StoryStep[] = [
  {
    id: "accounts",
    title: "O cartão fica fora do saldo.",
    text: "O saldo total soma só o que é seu. O que você gastou no cartão aparece à parte, como o que você deve, para você não contar com um dinheiro que já foi.",
    highlight: "card",
  },
  {
    id: "month",
    title: "Entrou, saiu, sobrou.",
    text: "Cada salário, conta e compra entra no mês com a sua categoria. Você vê na hora quanto entrou, quanto saiu e quanto ainda sobra.",
  },
  {
    id: "categories",
    title: "Para onde vai seu dinheiro.",
    text: "Os gastos do mês divididos por categoria. Fica fácil ver o que pesa mais e onde dá para cortar.",
  },
  {
    id: "goals",
    title: "Metas que saem do papel.",
    text: "Viagem, reserva de emergência, um notebook novo: cada meta mostra quanto já foi guardado e quanto falta. Você guarda quando puder e vê a barra andar.",
  },
];
