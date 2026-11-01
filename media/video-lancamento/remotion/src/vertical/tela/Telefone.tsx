import type { ReactNode } from "react";
import { Icone } from "./Icone";
import { LARGURA_TELA, tela } from "./tokensTela";
import { FONT } from "../../theme";

/** Abas de baixo, as mesmas quatro do app. */
const ABAS = [
  { rotulo: "Contas", icone: "wallet" },
  { rotulo: "Mês", icone: "arrow-left-right" },
  { rotulo: "Gastos", icone: "chart-pie" },
  { rotulo: "Metas", icone: "target" },
] as const;

/**
 * Moldura de iPhone desenhada em CSS, como `web/src/features/showcase/PhoneMockup.tsx`.
 * A tela fica no tema claro, oposto ao fundo verde do vídeo, como no app.
 */
export function Telefone({
  abaAtiva,
  rotulo,
  valor,
  tomValor = "neutro",
  selo = true,
  children,
}: {
  abaAtiva: number;
  rotulo: string;
  valor: string;
  tomValor?: "neutro" | "receita" | "despesa";
  selo?: boolean;
  children: ReactNode;
}) {
  const corValor =
    tomValor === "receita" ? tela.receita : tomValor === "despesa" ? tela.despesa : tela.texto;

  return (
    <div
      style={{
        width: LARGURA_TELA + 24,
        height: 892,
        borderRadius: 58,
        padding: 12,
        backgroundColor: "#0C1512",
        boxShadow:
          "0 50px 110px rgba(0,0,0,0.55), inset 0 0 0 1.5px rgba(244,247,242,0.16)",
        fontFamily: FONT,
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          borderRadius: 46,
          backgroundColor: tela.fundo,
          color: tela.texto,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* ilha dinâmica */}
        <div
          style={{
            position: "absolute",
            top: 12,
            left: "50%",
            transform: "translateX(-50%)",
            width: 104,
            height: 30,
            borderRadius: 999,
            backgroundColor: "#0C1512",
            zIndex: 2,
          }}
        />

        {/* barra de estado */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 26px 0",
            fontSize: 15,
            fontWeight: 600,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          <span>9:41</span>
          <span style={{ display: "flex", alignItems: "center", gap: 5, opacity: 0.85 }}>
            <Icone nome="chart-pie" tamanho={14} style={{ opacity: 0 }} />
            <Barrinhas />
            <Bateria />
          </span>
        </div>

        {/* cabeçalho: rótulo e o número grande */}
        <div style={{ padding: "22px 26px 14px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontSize: 15, color: tela.textoSuave }}>{rotulo}</span>
            {selo ? (
              <span
                style={{
                  fontSize: 12,
                  padding: "3px 10px",
                  borderRadius: 999,
                  backgroundColor: tela.muted,
                  color: tela.textoSuave,
                }}
              >
                Exemplo
              </span>
            ) : null}
          </div>
          <div
            style={{
              marginTop: 4,
              fontSize: 40,
              fontWeight: 600,
              letterSpacing: "-0.03em",
              fontVariantNumeric: "tabular-nums",
              color: corValor,
            }}
          >
            {valor}
          </div>
        </div>

        {/* conteúdo da tela */}
        <div style={{ flex: 1, padding: "0 22px", overflow: "hidden" }}>{children}</div>

        {/* abas */}
        <div
          style={{
            display: "flex",
            borderTop: `1px solid ${tela.borda}`,
            paddingTop: 10,
            paddingBottom: 20,
          }}
        >
          {ABAS.map((aba, i) => (
            <div
              key={aba.rotulo}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3,
                color: i === abaAtiva ? tela.texto : tela.textoSuave,
                opacity: i === abaAtiva ? 1 : 0.65,
              }}
            >
              <Icone nome={aba.icone} tamanho={21} />
              <span style={{ fontSize: 11, fontWeight: i === abaAtiva ? 600 : 400 }}>
                {aba.rotulo}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Barrinhas() {
  return (
    <svg width={17} height={12} viewBox="0 0 17 12" fill="currentColor">
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={i * 4.5} y={9 - i * 3} width={3} height={3 + i * 3} rx={1} />
      ))}
    </svg>
  );
}

function Bateria() {
  return (
    <svg width={24} height={12} viewBox="0 0 24 12" fill="none">
      <rect x={0.5} y={0.5} width={20} height={11} rx={3.5} stroke="currentColor" />
      <rect x={2} y={2} width={17} height={8} rx={2} fill="currentColor" />
      <path d="M22 4.5v3a2 2 0 0 0 0-3Z" fill="currentColor" />
    </svg>
  );
}
