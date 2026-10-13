import { VelosMark } from "@/components/brand/VelosMark";
import { Button } from "@/components/ui/button";

/** Carregando a sessão: a marca pulsa no centro (sem conteúdo falso). */
export function FullPageLoader() {
  return (
    <div className="grid min-h-dvh place-items-center" aria-busy="true">
      <VelosMark className="h-12 w-auto animate-pulse text-foreground" />
      <span className="sr-only" role="status">
        Carregando…
      </span>
    </div>
  );
}

/** Falha ao carregar a sessão que não é "sem login" (ex.: API fora do ar). */
export function FullPageError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="grid min-h-dvh place-items-center px-4">
      <div role="alert" className="max-w-sm space-y-4 text-center">
        <VelosMark className="mx-auto h-10 w-auto" />
        <h1 className="text-xl font-semibold">Não foi possível carregar seus dados</h1>
        <p className="text-muted-foreground">Confira sua conexão e tente de novo em instantes.</p>
        <Button className="h-11 px-5 text-base" onClick={onRetry}>
          Tentar de novo
        </Button>
      </div>
    </div>
  );
}
