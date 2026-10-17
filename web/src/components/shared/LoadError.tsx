import { CircleAlert, RotateCw } from "lucide-react";

import { Button } from "@/components/ui/button";

type LoadErrorProps = {
  title: string;
  message: string;
  onRetry: () => void;
  isRetrying?: boolean;
};

/** Estado de erro de uma lista ou tela: diz o problema e a saída ("Tentar de novo"). */
export function LoadError({ title, message, onRetry, isRetrying = false }: LoadErrorProps) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card px-6 py-10 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <CircleAlert className="size-6" aria-hidden="true" />
      </span>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="max-w-sm text-muted-foreground">{message}</p>
      <Button variant="outline" className="mt-1 h-11 px-5 text-base" onClick={onRetry} disabled={isRetrying}>
        <RotateCw className={isRetrying ? "animate-spin" : undefined} aria-hidden="true" />
        Tentar de novo
      </Button>
    </div>
  );
}
