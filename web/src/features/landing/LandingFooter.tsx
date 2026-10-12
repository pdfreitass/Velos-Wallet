import { InstagramIcon } from "@/components/brand/InstagramIcon";
import { VelosMark } from "@/components/brand/VelosMark";

export function LandingFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-[90rem] flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-20">
        <div className="flex items-center gap-3">
          <VelosMark className="h-9 w-auto" />
          <div>
            <p className="font-semibold tracking-tight">Velos Wallet</p>
            <p className="text-sm text-muted-foreground">Seu dinheiro na direção certa.</p>
          </div>
        </div>

        <div className="flex flex-col gap-2 text-sm sm:items-end">
          <a
            href="https://www.instagram.com/veloswallet"
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center gap-2 rounded-md font-medium hover:underline focus-visible:ring-3 focus-visible:ring-ring/60 focus-visible:outline-none"
          >
            <InstagramIcon className="size-4" />
            @veloswallet
            <span className="sr-only">no Instagram (abre em outra aba)</span>
          </a>
          <p className="text-muted-foreground">© {new Date().getFullYear()} Velos Wallet</p>
        </div>
      </div>
    </footer>
  );
}
