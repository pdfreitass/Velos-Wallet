import type { SVGProps } from "react";

/**
 * Marca do Velos redesenhada em vetor a partir de web/public/brand/velos-*.png (mesma geometria,
 * sem o fundo quadrado). A haste esquerda segue a cor do texto (verde profundo no claro, off-white
 * no escuro); a direita, mais alta, é sempre o verde vivo: a "direção certa".
 */
export function VelosMark({ title, ...props }: SVGProps<SVGSVGElement> & { title?: string }) {
  return (
    <svg
      viewBox="318 245 442 608"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      <polygon points="323,390 409,390 510,641 510,848" fill="currentColor" />
      <polygon points="669,250 755,250 514,848 514,641" fill="#2ED38C" />
    </svg>
  );
}
