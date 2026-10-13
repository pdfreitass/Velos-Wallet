/**
 * Pré-visualização dos modelos de email (spec 001, RN13 / C3).
 *
 * Troca as variáveis do Supabase por valores de exemplo e grava o HTML em
 * web/.preview-emails/, para abrir no navegador antes de colar no painel.
 * Também acusa variável desconhecida: um `{{ .SiteUrl }}` com maiúscula errada
 * chega ao email como texto cru, e isso só apareceria no teste real.
 *
 * Pré-visualizar NÃO substitui o CA16 (Gmail web/celular e Outlook, email de verdade).
 *
 * Uso: npm run preview:emails --prefix web   (Node 24 executa TypeScript sem build)
 */
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * Na pré-visualização a logo vem do arquivo local, para a prévia não depender de rede nem
 * do bucket (o upload do C6 foi feito em 2026-10-13, mas o mesmo arquivo serve offline).
 * A troca vale só para o arquivo gerado; o modelo versionado mantém a URL pública.
 */
const BUCKET_LOGO = "https://khvottmyspapwsdeqqnm.supabase.co/storage/v1/object/public/brand/velos-claro.png";
const LOCAL_LOGO = "velos-claro.png";

/** Valores de exemplo. O token é fictício, só para o link ficar com o tamanho real. */
const SAMPLE: Record<string, string> = {
  ".SiteURL": "http://localhost:3000",
  ".TokenHash": "pkce_3f7a1c9e2b4d8a6f0c5e1b7d9a3f6c2e8b4d0a7f1c5e9b3d6a2f8c4e0b7d1a5f",
};

const TEMPLATES = ["recovery.html", "confirmation.html"] as const;

const templatesDir = fileURLToPath(new URL("../../supabase/templates/", import.meta.url));
const outDir = fileURLToPath(new URL("../.preview-emails/", import.meta.url));

mkdirSync(outDir, { recursive: true });
copyFileSync(fileURLToPath(new URL("../public/brand/velos-claro.png", import.meta.url)), outDir + LOCAL_LOGO);

let unknown = 0;

for (const name of TEMPLATES) {
  const source = readFileSync(templatesDir + name, "utf8").replaceAll(BUCKET_LOGO, LOCAL_LOGO);

  // O Supabase usa template Go: {{ .Variavel }}, com espaçamento livre.
  const rendered = source.replace(/\{\{\s*(\.[A-Za-z]+)\s*\}\}/g, (match, variable: string) => {
    const value = SAMPLE[variable];
    if (value === undefined) {
      console.error(`${name}: variável desconhecida ${match}`);
      unknown += 1;
      return match;
    }
    return value;
  });

  writeFileSync(outDir + name, rendered, "utf8");
  console.log(`${name} → web/.preview-emails/${name}`);
}

if (unknown > 0) {
  console.error(`\n${unknown} variável(is) fora da lista conhecida: ${Object.keys(SAMPLE).join(", ")}`);
  process.exit(1);
}

console.log("\nOK: só variáveis conhecidas. Abra os arquivos no navegador para conferir.");
