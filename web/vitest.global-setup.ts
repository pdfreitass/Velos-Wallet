/**
 * Fuso do Brasil (UTC-3) em todos os testes: é nele que `new Date("yyyy-MM-dd")` vira o dia
 * anterior, o bug que `parseDbDate` evita. Roda no processo principal, antes dos workers
 * herdarem o ambiente.
 */
export default function setup() {
  process.env.TZ = "America/Sao_Paulo";
}
