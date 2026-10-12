/**
 * Datas no Velos Wallet.
 *
 * REGRA: nunca `new Date("2026-10-11")`. O JS interpreta uma data sem hora
 * como UTC meia-noite, que em UTC-3 e o dia ANTERIOR as 21h — a transacao do
 * dia 1 apareceria no dia 31. Usar sempre `parseISO`, que interpreta como
 * hora local.
 */
import { format, isValid, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

/** Converte a coluna `date` do Postgres ("2026-10-11") em Date local. */
export function parseDbDate(value: string): Date {
  const parsed = parseISO(value);
  if (!isValid(parsed)) {
    throw new Error(`Data invalida recebida do banco: ${value}`);
  }
  return parsed;
}

/** Date -> "2026-10-11", o formato que a coluna `date` espera. */
export function toDbDate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/** "2026-10-11" -> "11/10/2026" */
export function formatDate(value: string | Date): string {
  const date = typeof value === "string" ? parseDbDate(value) : value;
  return format(date, "dd/MM/yyyy", { locale: ptBR });
}

/** "2026-10-11" -> "11 de outubro" */
export function formatDayMonth(value: string | Date): string {
  const date = typeof value === "string" ? parseDbDate(value) : value;
  return format(date, "d 'de' MMMM", { locale: ptBR });
}

/** "2026-10-11" -> "Outubro de 2026" */
export function formatMonthLabel(value: string | Date): string {
  const date = typeof value === "string" ? parseDbDate(value) : value;
  const label = format(date, "MMMM 'de' yyyy", { locale: ptBR });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** "2026-10" — chave de mes usada nos filtros e nas queries. */
export function toMonthKey(date: Date): string {
  return format(date, "yyyy-MM");
}
