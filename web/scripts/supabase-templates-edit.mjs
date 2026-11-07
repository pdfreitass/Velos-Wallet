// Script Playwright: abre uma cópia do perfil do Chrome (sessão do Supabase)
// e gerencia os templates de email em Authentication -> Emails.
// Uso: node web/scripts/supabase-templates-edit.mjs [explore|openeditor|edit|verify|preview]
//
// Pré-requisitos (a cada execução, depois de fechar o Chrome por completo):
//  1. Copiar o mínimo do perfil para Temp (o Chrome bloqueia remote debugging
//     no diretório de perfil padrão), ex. em Git Bash:
//       UD="${LOCALAPPDATA//\\//}/Google/Chrome/User Data"
//       TARGET="${LOCALAPPDATA//\\//}/Temp/velos-chrome-profile/Default"
//       rm -rf "${TARGET%/Default}" && mkdir -p "$TARGET" \
//         && cp -r "$UD/Default/Network" "$TARGET/" \
//         && cp -r "$UD/Default/Local Storage" "$TARGET/"
//  2. Rodar: node web/scripts/supabase-templates-edit.mjs edit
//     (publica o assunto + o conteúdo de supabase/templates/confirmation.html
//      no template "Confirm sign up" do projeto e verifica o que ficou salvo).
//  3. APAGAR A CÓPIA no fim. Ela contém os cookies e o Local Storage do Chrome,
//     ou seja, a sessão do Supabase em claro, e o Temp não se limpa sozinho:
//       rm -rf "${LOCALAPPDATA//\\//}/Temp/velos-chrome-profile"
//
// O script só lê a cópia (launchPersistentContext) — quem a cria e quem a apaga
// é o passo manual acima.
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const PROJECT_REF = "khvottmyspapwsdeqqnm";
const TEMPLATES_URL = `https://supabase.com/dashboard/project/${PROJECT_REF}/auth/templates`;
const EDITOR_URL = `${TEMPLATES_URL}/confirm-sign-up`;
// O Chrome moderno bloqueia remote debugging no diretório de perfil padrão.
// Usamos uma cópia mínima do perfil (cookies + localStorage) criada em Temp.
const USER_DATA =
  process.env.VELOS_PROFILE ?? path.join(os.tmpdir(), "velos-chrome-profile");
const SHOT_DIR = path.join(os.tmpdir(), "supabase-dashboard");
const MODE = process.argv[2] ?? "explore";

fs.mkdirSync(SHOT_DIR, { recursive: true });

const NEW_SUBJECT = "Confirme seu cadastro no Velos Wallet";
const NEW_HTML = fs.readFileSync(
  path.join(process.cwd(), "supabase", "templates", "confirmation.html"),
  "utf8",
);
const EXPECTED_LINES = NEW_HTML.split(/\r?\n/).length;

const browser = await chromium.launchPersistentContext(USER_DATA, {
  channel: "chrome",
  headless: false,
  viewport: { width: 1500, height: 950 },
  slowMo: 80,
  args: [
    "--profile-directory=Default",
    "--no-first-run",
    "--no-default-browser-check",
  ],
});

const page = browser.pages()[0] ?? (await browser.newPage());
page.setDefaultTimeout(30000);
page.on("dialog", (d) => d.accept().catch(() => {}));

async function shot(name) {
  const p = path.join(SHOT_DIR, name.endsWith(".png") ? name : `${name}.png`);
  await page.screenshot({ path: p });
  console.log("SHOT", p);
  return p;
}

async function closeBanners() {
  const closers = page.getByRole("button", { name: "Close banner", exact: true });
  const n = await closers.count().catch(() => 0);
  for (let i = 0; i < n; i++) {
    try {
      await closers.nth(i).click({ timeout: 3000 });
      await page.waitForTimeout(300);
    } catch {}
  }
}

async function ensureSourceTab() {
  const sourceTab = page.getByRole("button", { name: "Source", exact: true });
  if ((await sourceTab.count().catch(() => 0)) > 0) {
    await sourceTab.click().catch(() => {});
    await page.waitForTimeout(800);
  }
}

function normalize(s) {
  return String(s ?? "").replace(/\r\n/g, "\n").replace(/\s+$/g, "");
}

// Lê (e opcionalmente substitui) o texto do modelo Monaco via window.monaco.
async function monacoGetOrSet(htmlToSet) {
  return page.evaluate((htmlText) => {
    const m = globalThis.monaco;
    if (!m || !m.editor || !m.editor.getModels) {
      return { ok: false, reason: "window.monaco indisponivel" };
    }
    const models = m.editor.getModels();
    if (!models.length) return { ok: false, reason: "nenhum modelo Monaco montado" };
    const info = models.map((md) => ({
      lang: md.getLanguageId(),
      len: md.getValue().length,
      uri: md.uri.toString(),
    }));
    const model =
      models.find((md) => md.getLanguageId() === "html") ?? models[0];
    if (htmlText !== null) model.setValue(htmlText);
    const value = model.getValue();
    return {
      ok: true,
      count: models.length,
      info,
      lang: model.getLanguageId(),
      lines: model.getLineCount(),
      len: value.length,
      value,
    };
  }, htmlToSet);
}

async function clickPreviewTab() {
  return page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const b = btns.find((x) => (x.innerText || "").trim() === "Preview");
    if (!b) return false;
    b.click();
    return true;
  });
}

// Texto renderizado no Preview (a aba pode usar iframe/srcdoc)
async function previewInfo() {
  const out = { bodySnippet: "", frames: [] };
  const bodyText = (await page.locator("body").innerText().catch(() => "")) ?? "";
  out.bodySnippet = bodyText.slice(0, 3000);
  for (const f of page.frames()) {
    if (f === page.mainFrame()) continue;
    const t = (await f.locator("body").innerText().catch(() => "")) ?? "";
    out.frames.push({ url: f.url().slice(0, 120), text: t.slice(0, 800) });
  }
  return out;
}

async function pollToast(maxMs = 8000) {
  const deadline = Date.now() + maxMs;
  let last = "";
  while (Date.now() < deadline) {
    last = (await page.locator("body").innerText().catch(() => "")) ?? "";
    if (/successfully saved|saved successfully|template updated/i.test(last)) {
      return { kind: "success", text: last.match(/(?:successfully saved|saved successfully|template updated)[^\n]{0,120}/i)?.[0] ?? "" };
    }
    if (/failed to|error/i.test(last)) {
      const m = last.match(/(?:Failed to|Error)[^\n]{0,160}/i)?.[0] ?? "";
      return { kind: "error", text: m };
    }
    await page.waitForTimeout(600);
  }
  return { kind: "none", text: "" };
}

async function dumpPage(label) {
  const url = page.url();
  const title = await page.title().catch(() => "");
  const bodyText = (await page.locator("body").innerText().catch(() => "")).slice(0, 4000);
  const inputs = await page
    .locator("input:not([type=hidden])")
    .evaluateAll((els) =>
      els.map((e) => ({
        id: e.id,
        name: e.name,
        type: e.type,
        value: e.value.slice(0, 120),
      })),
    )
    .catch(() => []);
  const buttons = await page
    .locator("button")
    .evaluateAll((els) =>
      els
        .map((e) => ({
          text: (e.innerText || e.getAttribute("aria-label") || "").trim().slice(0, 60),
          disabled: e.disabled,
        }))
        .filter((b) => b.text),
    )
    .catch(() => []);
  console.log(`\n===== DUMP ${label} =====`);
  console.log("URL:", url);
  console.log("TITLE:", title);
  console.log("INPUTS:", JSON.stringify(inputs, null, 1));
  console.log("BUTTONS:", JSON.stringify(buttons, null, 1));
  console.log("BODY (first 4000):\n", bodyText);
  await shot(label);
}

try {
  if (MODE === "explore" || MODE === "openeditor") {
    await page.goto(TEMPLATES_URL, { waitUntil: "domcontentloaded", timeout: 90000 });
    await page.waitForTimeout(5000);
    await closeBanners();
    if (MODE === "explore") {
      await dumpPage("01-templates");
      console.log("\nEXPLORE_DONE");
    } else {
      const rowText = page.getByText("Confirm sign up", { exact: true }).first();
      await rowText.waitFor({ state: "visible" });
      await rowText.click();
      await page.waitForTimeout(4000);
      await closeBanners();
      await dumpPage("02-editor");
      console.log("\nEDITOR_OPENED");
    }
  } else if (MODE === "edit") {
    console.log("EXPECTED_LINES:", EXPECTED_LINES, "| BYTES:", NEW_HTML.length);
    await page.goto(EDITOR_URL, { waitUntil: "domcontentloaded", timeout: 90000 });
    await page.waitForSelector("#MAILER_SUBJECTS_CONFIRMATION", { timeout: 30000 });
    await page.waitForTimeout(2500);
    await closeBanners();

    // 1) Assunto
    const subjectInput = page.locator("#MAILER_SUBJECTS_CONFIRMATION");
    await subjectInput.fill(NEW_SUBJECT);
    console.log("SUBJECT_FILLED:", await subjectInput.inputValue());

    // 2) Corpo: setValue direto no modelo Monaco (sem auto-indent)
    await ensureSourceTab();
    const before = await monacoGetOrSet(null);
    console.log(
      "MONACO_BEFORE:",
      JSON.stringify({ ok: before.ok, reason: before.reason, count: before.count, info: before.info, lang: before.lang, lines: before.lines, len: before.len }),
    );
    if (!before.ok) throw new Error(`Monaco inacessivel: ${before.reason}`);

    const after = await monacoGetOrSet(NEW_HTML);
    console.log(
      "MONACO_AFTER:",
      JSON.stringify({ ok: after.ok, lines: after.lines, len: after.len }),
    );
    const modelOk = after.ok && after.lines === EXPECTED_LINES && after.len === NEW_HTML.length;
    if (!modelOk) {
      await shot("03-falha-conferencia");
      throw new Error(`Conferencia do modelo falhou (lines=${after.lines}/${EXPECTED_LINES} len=${after.len}/${NEW_HTML.length}) — nada foi salvo.`);
    }
    await page.waitForTimeout(800);
    await shot("03-antes-de-salvar");

    // 3) Salvar
    await page.getByRole("button", { name: "Save changes", exact: true }).click();
    const toast = await pollToast();
    console.log("TOAST:", JSON.stringify(toast));
    await shot("04-apos-salvar");

    // 4) Verificação pós-reload
    await page.reload({ waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForSelector("#MAILER_SUBJECTS_CONFIRMATION", { timeout: 30000 });
    await page.waitForTimeout(2500);
    await closeBanners();

    const savedSubject = await page.locator("#MAILER_SUBJECTS_CONFIRMATION").inputValue().catch(() => null);
    const subjectOk = normalize(savedSubject) === normalize(NEW_SUBJECT);

    await ensureSourceTab();
    const saved = await monacoGetOrSet(null);
    const savedOk =
      saved.ok &&
      saved.lines === EXPECTED_LINES &&
      normalize(saved.value) === normalize(NEW_HTML);
    console.log(
      "SAVED_MODEL:",
      JSON.stringify({ ok: saved.ok, lines: saved.lines, len: saved.len, subject: savedSubject }),
    );
    await shot("05-verificacao-source");

    let previewOk = false;
    if (await clickPreviewTab()) {
      await page.waitForTimeout(2500);
      const pv = await previewInfo();
      const allText = pv.bodySnippet + "\n" + pv.frames.map((f) => f.text).join("\n");
      previewOk = allText.includes("Confirmar meu email") && allText.includes("Velos Wallet");
      console.log("PREVIEW_OK:", previewOk, "| FRAMES:", pv.frames.length);
      console.log("PREVIEW_SNIPPET:", JSON.stringify(allText.slice(0, 600)));
      await shot("06-verificacao-preview");
    }

    console.log(
      `\nVERIFY subject_ok=${subjectOk} model_ok=${savedOk} toast=${toast.kind} preview_ok=${previewOk}`,
    );
    if (toast.kind !== "success" || !subjectOk || !savedOk || !previewOk) {
      console.error("VERIFY_FAILED");
      process.exitCode = 2;
    } else {
      console.log("PUBLICADO_OK");
    }
  } else if (MODE === "preview") {
    await page.goto(EDITOR_URL, { waitUntil: "domcontentloaded", timeout: 90000 });
    await page.waitForSelector("#MAILER_SUBJECTS_CONFIRMATION", { timeout: 30000 });
    await page.waitForTimeout(2500);
    await closeBanners();
    const tabs = await page
      .locator("button")
      .evaluateAll((els) =>
        els
          .filter((e) => /Preview|Source/.test(e.innerText || ""))
          .map((e) => ({
            text: (e.innerText || "").trim(),
            ariaHidden: e.getAttribute("aria-hidden"),
            tabindex: e.getAttribute("tabindex"),
            pointerEvents: getComputedStyle(e).pointerEvents,
            visible: e.offsetParent !== null,
            cls: e.className.slice(0, 90),
          })),
      )
      .catch(() => []);
    console.log("TABS:", JSON.stringify(tabs, null, 1));
    const clicked = await clickPreviewTab();
    console.log("PREVIEW_CLICKED:", clicked);
    await page.waitForTimeout(3000);
    const pv = await previewInfo();
    console.log("FRAMES:", pv.frames.length);
    console.log("BODY_SNIPPET:", JSON.stringify(pv.bodySnippet.slice(0, 800)));
    for (const f of pv.frames) console.log("FRAME:", JSON.stringify(f));
    await shot("09-preview-diag");
  } else if (MODE === "verify") {
    await page.goto(EDITOR_URL, { waitUntil: "domcontentloaded", timeout: 90000 });
    await page.waitForSelector("#MAILER_SUBJECTS_CONFIRMATION", { timeout: 30000 });
    await page.waitForTimeout(2500);
    await closeBanners();

    const savedSubject = await page.locator("#MAILER_SUBJECTS_CONFIRMATION").inputValue().catch(() => null);
    const subjectOk = normalize(savedSubject) === normalize(NEW_SUBJECT);

    await ensureSourceTab();
    const saved = await monacoGetOrSet(null);
    const savedOk =
      saved.ok &&
      saved.lines === EXPECTED_LINES &&
      normalize(saved.value) === normalize(NEW_HTML);
    console.log(
      "SAVED_MODEL:",
      JSON.stringify({ ok: saved.ok, lines: saved.lines, len: saved.len, subject: savedSubject }),
    );
    await shot("07-verify-only-source");

    let previewOk = false;
    if (await clickPreviewTab()) {
      await page.waitForTimeout(2500);
      const pv = await previewInfo();
      const allText = pv.bodySnippet + "\n" + pv.frames.map((f) => f.text).join("\n");
      previewOk = allText.includes("Confirmar meu email") && allText.includes("Velos Wallet");
      console.log("PREVIEW_OK:", previewOk, "| FRAMES:", pv.frames.length);
      await shot("08-verify-only-preview");
    }

    console.log(`\nVERIFY subject_ok=${subjectOk} model_ok=${savedOk} preview_ok=${previewOk}`);
    if (!subjectOk || !savedOk || !previewOk) process.exitCode = 2;
    else console.log("VERIFY_OK");
  }
} catch (err) {
  console.error("ERRO:", err && err.message ? err.message : err);
  await dumpPage("99-error").catch(() => {});
} finally {
  await browser.close();
}
