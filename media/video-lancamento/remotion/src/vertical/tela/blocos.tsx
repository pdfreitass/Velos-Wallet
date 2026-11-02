import { Icone } from "./Icone";
import { tela } from "./tokensTela";
import { formatarMoedaComSinal } from "./dados";

/**
 * Peças repetidas nas telas do app: a linha de lista, o rótulo de seção e a barra de fluxo.
 * Ficam aqui para `Telas.tsx` conter só as quatro telas.
 */

export type Tom = "neutro" | "receita" | "despesa";

function corDoTom(tom: Tom): string {
  if (tom === "receita") return tela.receita;
  if (tom === "despesa") return tela.despesa;
  return tela.texto;
}

/** Linha com ícone, nome, apoio e valor — a forma repetida em três das quatro telas. */
export function Linha({
  icone,
  titulo,
  apoio,
  valor,
  tom = "neutro",
  opacidade,
  deslocamento,
}: {
  icone: string;
  titulo: string;
  apoio?: string;
  valor: string;
  tom?: Tom;
  opacidade: number;
  deslocamento: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 11,
        padding: "9px 6px",
        opacity: opacidade,
        transform: `translateY(${deslocamento}px)`,
      }}
    >
      <span
        style={{
          display: "grid",
          placeItems: "center",
          width: 38,
          height: 38,
          borderRadius: 11,
          backgroundColor: tela.muted,
          flexShrink: 0,
        }}
      >
        <Icone nome={icone} tamanho={19} />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 15, fontWeight: 500 }}>{titulo}</span>
        {apoio ? (
          <span style={{ display: "block", fontSize: 12.5, color: tela.textoSuave }}>{apoio}</span>
        ) : null}
      </span>
      <span
        style={{
          fontSize: 15,
          fontWeight: 600,
          fontVariantNumeric: "tabular-nums",
          color: corDoTom(tom),
        }}
      >
        {valor}
      </span>
    </div>
  );
}

export function Rotulo({ texto, opacidade }: { texto: string; opacidade: number }) {
  return (
    <div
      style={{
        padding: "0 6px",
        fontSize: 12.5,
        fontWeight: 500,
        color: tela.textoSuave,
        opacity: opacidade,
      }}
    >
      {texto}
    </div>
  );
}

/** Barra de entradas/saídas do mês. `largura` já vem animada pelo chamador. */
export function Barra({
  rotulo,
  centavos,
  sentido,
  largura,
  opacidade,
}: {
  rotulo: string;
  centavos: number;
  sentido: "in" | "out";
  largura: number;
  opacidade: number;
}) {
  const cor = sentido === "in" ? tela.receita : tela.despesa;
  return (
    <div style={{ opacity: opacidade }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 15 }}>
        <Icone
          nome={sentido === "in" ? "arrow-down-left" : "arrow-up-right"}
          tamanho={17}
          style={{ color: cor }}
        />
        <span style={{ flex: 1, fontWeight: 500 }}>{rotulo}</span>
        <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums", color: cor }}>
          {formatarMoedaComSinal(centavos, sentido)}
        </span>
      </div>
      <div
        style={{
          marginTop: 7,
          height: 9,
          borderRadius: 999,
          backgroundColor: tela.muted,
          overflow: "hidden",
        }}
      >
        <div
          style={{ width: `${largura}%`, height: "100%", borderRadius: 999, backgroundColor: cor }}
        />
      </div>
    </div>
  );
}
