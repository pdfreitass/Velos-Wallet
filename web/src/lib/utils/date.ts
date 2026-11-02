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

/** "en-CA" formata como "2026-10-17": o mesmo formato da coluna `date`. */
const saoPauloDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Sao_Paulo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/**
 * "Hoje" em São Paulo, como "yyyy-MM-dd", qualquer que seja o fuso do aparelho. É o mesmo "hoje"
 * da API (RN4 da spec 004): a data da transação nunca passa dele.
 */
export function todayInSaoPaulo(now: Date = new Date()): string {
  return saoPauloDate.format(now);
}

/** Mês atual em São Paulo ("2026-10"). */
export function currentMonthKey(now: Date = new Date()): string {
  return todayInSaoPaulo(now).slice(0, 7);
}

const MONTH_KEY = /^(\d{4})-(0[1-9]|1[0-2])$/;

/** "2026-10" válido (o mesmo intervalo de anos que a API aceita). */
export function isMonthKey(value: string | null): value is string {
  const match = value ? MONTH_KEY.exec(value) : null;
  if (!match) return false;
  const year = Number(match[1]);
  return year >= 2000 && year <= 2100;
}

/** "2026-01" + (-1) -> "2025-12". Só aritmética de inteiros, sem Date. */
export function shiftMonth(monthKey: string, delta: number): string {
  const [year, month] = monthKey.split("-").map(Number);
  const index = year * 12 + (month - 1) + delta;
  const nextYear = Math.floor(index / 12);
  const nextMonth = (index % 12) + 1;
  return `${nextYear}-${String(nextMonth).padStart(2, "0")}`;
}

/** "2026-10" -> "outubro de 2026" (minúsculo, para o meio de uma frase). */
export function formatMonthName(monthKey: string): string {
  return format(parseDbDate(`${monthKey}-01`), "MMMM 'de' yyyy", { locale: ptBR });
}

/**
 * Cabeçalho de um dia na lista: "Hoje", "Ontem" ou "sexta, 10 de outubro" (o "-feira" sai para
 * caber no celular). `today` é o de São Paulo.
 */
export function formatDayHeading(value: string, today: string): string {
  if (value === today) return "Hoje";
  if (value === toDbDate(addDaysToDb(today, -1))) return "Ontem";

  const label = format(parseDbDate(value), "EEEE, d 'de' MMMM", { locale: ptBR }).replace("-feira", "");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function addDaysToDb(value: string, days: number): Date {
  const date = parseDbDate(value);
  date.setDate(date.getDate() + days);
  return date;
}
