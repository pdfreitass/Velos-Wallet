/**
 * Paridade das regras de senha (RN1): os MESMOS casos de
 * api/tests/Velos.Domain.Tests/Auth/PasswordPolicyTests.cs rodados contra o Zod do front.
 * Se divergirem, uma senha passa num lado e é recusada no outro.
 *
 * Uso: node web/scripts/password-parity.ts   (Node 24 executa TypeScript sem build)
 */
import { PASSWORD_REQUIREMENTS, passwordSchema } from "../src/lib/validations/auth.ts";

const strong = ["Pedro10@", "Abcdef1!", "Senha-Forte9", "Z9z~xxxx", "Aa1`aaaa", "Aa1\\aaaa", 'Aa1"aaaa', "Aa1'aaaa", "Pédro10@"];

const weak: Array<[string, string[]]> = [
  ["pedro10@", ["uppercase"]],
  ["PEDRO10@", ["lowercase"]],
  ["Pedro10a", ["symbol"]],
  ["Pedro@ab", ["number"]],
  ["Pe10@", ["length"]],
  ["Pedrooo1ç", ["symbol"]],
  ["Pedro 10x", ["symbol"]],
  ["Pedro10€", ["symbol"]],
  ["Ａbcdef1!", ["uppercase"]],
  ["12345678", ["lowercase", "uppercase", "symbol"]],
  ["", ["length", "lowercase", "uppercase", "number", "symbol"]],
];

const symbols = "!@#$%^&*()_+-=[]{};'\\:\"|<>?,./`~";
const unmet = (password: string) => PASSWORD_REQUIREMENTS.filter((r) => !r.test(password)).map((r) => r.id);

let failures = 0;
const check = (ok: boolean, label: string) => {
  if (!ok) {
    failures++;
    console.log(`FALHOU: ${label}`);
  }
};

for (const password of strong) check(passwordSchema.safeParse(password).success, `forte recusada: ${JSON.stringify(password)}`);
for (const [password, expected] of weak) {
  check(!passwordSchema.safeParse(password).success, `fraca aceita: ${JSON.stringify(password)}`);
  check(JSON.stringify(unmet(password)) === JSON.stringify(expected), `requisitos de ${JSON.stringify(password)}: ${unmet(password)} ≠ ${expected}`);
}
for (const symbol of symbols) check(unmet(`Abcdef1${symbol}`).length === 0, `símbolo não reconhecido: ${symbol}`);
const atLimit = "Aa1!" + "x".repeat(68);
check(passwordSchema.safeParse(atLimit).success, "72 caracteres recusados");
check(!passwordSchema.safeParse(atLimit + "x").success, "73 caracteres aceitos");

console.log(failures === 0 ? `OK: ${strong.length + weak.length + symbols.length + 2} casos iguais aos do C#` : `${failures} divergência(s)`);
process.exit(failures === 0 ? 0 : 1);
