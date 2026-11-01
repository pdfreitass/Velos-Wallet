import { Icone } from "./Icone";
import { Telefone } from "./Telefone";
import { Barra, Linha, Rotulo } from "./blocos";
import { tela } from "./tokensTela";
import { contar, crescerBarra, escalonado } from "./animacao";
import {
  contaCartao,
  contasAtivo,
  entradasMesCentavos,
  formatarMoeda,
  formatarMoedaComSinal,
  gastosPorCategoria,
  guardadoNasMetasCentavos,
  lancamentosRecentes,
  metas,
  participacaoSaidas,
  saidasMesCentavos,
  saldoTotalCentavos,
  sobrouMesCentavos,
} from "./dados";

/**
 * As quatro telas do app, desenhadas em código para poderem ser animadas por dentro: os números
 * contam, as barras crescem e a rosca se desenha. Com captura PNG nada disso seria possível.
 *
 * Cada tela recebe `frame` contado a partir do instante em que ela entra.
 */


/** Tela 1 — Contas: o saldo conta para cima e as contas entram somando uma a uma. */
export function TelaContas({ frame }: { frame: number }) {
  return (
    <Telefone
      abaAtiva={0}
      rotulo="Saldo total"
      valor={formatarMoeda(contar(frame, saldoTotalCentavos, 2, 38))}
    >
      <Rotulo texto="Somam no saldo" opacidade={escalonado(frame, 0, 4, 14)} />
      <div style={{ marginTop: 4 }}>
        {contasAtivo.map((conta, i) => {
          const p = escalonado(frame, i, 5, 18);
          return (
            <Linha
              key={conta.nome}
              icone={conta.icone}
              titulo={conta.nome}
              apoio={conta.tipo}
              valor={formatarMoeda(conta.centavos)}
              opacidade={p}
              deslocamento={(1 - p) * 14}
            />
          );
        })}
      </div>

      <div style={{ marginTop: 16 }}>
        <Rotulo texto="Fora do saldo" opacidade={escalonado(frame, 3, 5, 14)} />
        <div style={{ marginTop: 4 }}>
          {(() => {
            const p = escalonado(frame, 4, 5, 18);
            return (
              <Linha
                icone={contaCartao.icone}
                titulo={contaCartao.nome}
                apoio={contaCartao.tipo}
                valor={formatarMoedaComSinal(contaCartao.centavos, "out")}
                tom="despesa"
                opacidade={p}
                deslocamento={(1 - p) * 14}
              />
            );
          })()}
        </div>
      </div>
    </Telefone>
  );
}

/** Tela 2 — Mês: as duas barras crescem e os lançamentos entram escalonados. */
export function TelaMes({ frame }: { frame: number }) {
  return (
    <Telefone
      abaAtiva={1}
      rotulo="Sobrou este mês"
      valor={formatarMoedaComSinal(contar(frame, sobrouMesCentavos, 2, 38), "in")}
      tomValor="receita"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 15, padding: "0 6px" }}>
        <Barra
          rotulo="Entradas"
          centavos={entradasMesCentavos}
          sentido="in"
          largura={crescerBarra(frame, 100, 4, 32)}
          opacidade={escalonado(frame, 0, 4, 14)}
        />
        <Barra
          rotulo="Saídas"
          centavos={saidasMesCentavos}
          sentido="out"
          largura={crescerBarra(frame, participacaoSaidas, 10, 32)}
          opacidade={escalonado(frame, 1, 4, 14)}
        />
      </div>

      <div style={{ marginTop: 20 }}>
        <Rotulo texto="Últimos lançamentos" opacidade={escalonado(frame, 3, 4, 14)} />
        <div style={{ marginTop: 2 }}>
          {lancamentosRecentes.map((lancamento, i) => {
            const p = escalonado(frame, 4 + i, 4, 16);
            return (
              <Linha
                key={lancamento.titulo}
                icone={lancamento.icone}
                titulo={lancamento.titulo}
                apoio={lancamento.categoria}
                valor={formatarMoedaComSinal(lancamento.centavos, lancamento.sentido)}
                tom={lancamento.sentido === "in" ? "receita" : "despesa"}
                opacidade={p}
                deslocamento={(1 - p) * 12}
              />
            );
          })}
        </div>
      </div>
    </Telefone>
  );
}

/** Tela 3 — Gastos: a rosca se desenha fatia a fatia e a lista entra por baixo. */
export function TelaGastos({ frame }: { frame: number }) {
  // A rosca cresce como um relógio: `varrida` é quantos por cento do círculo já existem.
  const varrida = crescerBarra(frame, 100, 4, 40);

  const paradas: string[] = [];
  let inicio = 0;
  for (const categoria of gastosPorCategoria) {
    const fim = inicio + categoria.fatia;
    const corte = Math.min(fim, varrida);
    if (corte > inicio) {
      // 0,6 pp de fresta entre fatias, como no app
      paradas.push(`${categoria.cor} ${inicio}% ${Math.max(inicio, corte - 0.6)}%`);
      paradas.push(`${tela.fundo} ${Math.max(inicio, corte - 0.6)}% ${corte}%`);
    }
    inicio = fim;
  }
  paradas.push(`${tela.muted} ${varrida}% 100%`);

  return (
    <Telefone
      abaAtiva={2}
      rotulo="Gastos do mês"
      valor={formatarMoedaComSinal(contar(frame, saidasMesCentavos, 2, 38), "out")}
      tomValor="despesa"
    >
      <div style={{ display: "grid", placeItems: "center", marginBottom: 10 }}>
        <div style={{ position: "relative", width: 124, height: 124 }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              backgroundImage: `conic-gradient(${paradas.join(", ")})`,
              // o furo da rosca
              mask: "radial-gradient(circle, transparent 54%, black 55%)",
              WebkitMask: "radial-gradient(circle, transparent 54%, black 55%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center",
              textAlign: "center",
            }}
          >
            <span>
              <span
                style={{
                  display: "block",
                  fontSize: 22,
                  fontWeight: 600,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {gastosPorCategoria.length}
              </span>
              <span style={{ display: "block", fontSize: 12, color: tela.textoSuave }}>
                categorias
              </span>
            </span>
          </div>
        </div>
      </div>

      <div>
        {gastosPorCategoria.map((categoria, i) => {
          const p = escalonado(frame, i, 4, 16);
          return (
            <div
              key={categoria.nome}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
                padding: "6px 6px",
                fontSize: 14.5,
                opacity: p,
                transform: `translateY(${(1 - p) * 10}px)`,
              }}
            >
              <span
                style={{
                  width: 11,
                  height: 11,
                  borderRadius: "50%",
                  backgroundColor: categoria.cor,
                  flexShrink: 0,
                }}
              />
              <Icone nome={categoria.icone} tamanho={17} style={{ color: tela.textoSuave }} />
              <span style={{ flex: 1, minWidth: 0, fontWeight: 500 }}>{categoria.nome}</span>
              <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                {formatarMoeda(categoria.centavos)}
              </span>
              <span
                style={{
                  width: 40,
                  textAlign: "right",
                  fontSize: 12.5,
                  color: tela.textoSuave,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {Math.round(categoria.fatia)}%
              </span>
            </div>
          );
        })}
      </div>
    </Telefone>
  );
}

/** Tela 4 — Metas: cada barra de progresso cresce até a sua percentagem, que conta junto. */
export function TelaMetas({ frame }: { frame: number }) {
  return (
    <Telefone
      abaAtiva={3}
      rotulo="Guardado nas metas"
      valor={formatarMoeda(contar(frame, guardadoNasMetasCentavos, 2, 38))}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 20, padding: "6px 6px 0" }}>
        {metas.map((meta, i) => {
          const p = escalonado(frame, i, 6, 18);
          const inicioBarra = 6 + i * 6;
          const pct = Math.round(crescerBarra(frame, meta.percentagem, inicioBarra, 32));
          return (
            <div key={meta.nome} style={{ opacity: p, transform: `translateY(${(1 - p) * 12}px)` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                <span
                  style={{
                    display: "grid",
                    placeItems: "center",
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    backgroundColor: tela.muted,
                    flexShrink: 0,
                  }}
                >
                  <Icone nome={meta.icone} tamanho={17} />
                </span>
                <span style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 500 }}>
                  {meta.nome}
                </span>
                <span
                  style={{ fontSize: 15, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}
                >
                  {pct}%
                </span>
              </div>
              <div
                style={{
                  marginTop: 9,
                  height: 9,
                  borderRadius: 999,
                  backgroundColor: tela.muted,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${crescerBarra(frame, meta.percentagem, inicioBarra, 32)}%`,
                    height: "100%",
                    borderRadius: 999,
                    backgroundColor: tela.receita,
                  }}
                />
              </div>
              <div
                style={{
                  marginTop: 7,
                  fontSize: 12.5,
                  color: tela.textoSuave,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {formatarMoeda(meta.guardadoCentavos)} de {formatarMoeda(meta.alvoCentavos)}
              </div>
            </div>
          );
        })}
      </div>
    </Telefone>
  );
}
