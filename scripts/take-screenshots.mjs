/**
 * Automated store screenshots using Playwright.
 * Navigates the live app UI to switch themes (no localStorage manipulation).
 *
 * Usage:  node scripts/take-screenshots.mjs
 * Requires: `npx next start -p 3100` running in another terminal
 * Output:   screenshots/ directory
 */

import { chromium } from "@playwright/test";
import { mkdirSync } from "fs";

const BASE_URL = "http://localhost:3100";
const OUT_DIR = "screenshots";
mkdirSync(OUT_DIR, { recursive: true });

// 390×844 at 2x → 780×1688 px (valid for both stores, natural phone feel)
const PHONE_VIEWPORT = { width: 390, height: 844 };
const PHONE_SCALE = 2;
const FEATURE = { width: 1024, height: 500 };

// English aria-labels from i18n/translations.ts
const THEME_LABELS = {
  obsidian: "Obsidian",
  emerald: "Emerald",
  "al-andalus": "Al-Andalus",
  midnight: "Midnight",
};

async function applyTheme(page, theme) {
  await page.goto(`${BASE_URL}/reglages/themes`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  // Click the theme button by its aria-label
  await page.getByRole("button", { name: THEME_LABELS[theme] }).first().click();
  await page.waitForTimeout(600);
  // If a premium modal appeared (unlock prompt), close it — themes are pre-unlocked via store
  const modal = page.locator('[role="dialog"]');
  if (await modal.isVisible({ timeout: 500 }).catch(() => false)) {
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
  }
}

async function unlockPremiumThemes(page) {
  // Inject unlock directly via the store action exposed on window (safe after hydration)
  await page.evaluate(() => {
    const key = "tasbihDigitalStateV1";
    let s = {};
    try { s = JSON.parse(localStorage.getItem(key) || "{}"); } catch {}
    s.preferences = s.preferences || {};
    s.preferences.unlockedThemes = ["obsidian", "emerald", "midnight", "al-andalus"];
    s.preferences.language = "en";
    localStorage.setItem(key, JSON.stringify(s));
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
}

async function shot(page, filename) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${OUT_DIR}/${filename}`, fullPage: false });
  console.log(`  ✓ ${filename}`);
}

async function run() {
  const browser = await chromium.launch({ args: ["--ignore-certificate-errors"] });

  // ── Phone screenshots ─────────────────────────────────────────────────────
  console.log(`\nPhone screenshots (${PHONE_VIEWPORT.width * PHONE_SCALE}×${PHONE_VIEWPORT.height * PHONE_SCALE} px):`);

  const ctx = await browser.newContext({
    viewport: PHONE_VIEWPORT,
    deviceScaleFactor: PHONE_SCALE,
    isMobile: true,
    hasTouch: true,
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  });

  const page = await ctx.newPage();
  page.on("console", (m) => { if (m.type() === "error") console.error("  [page error]", m.text()); });

  // Warm up + unlock premium themes in localStorage
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await unlockPremiumThemes(page);

  // 1. Counter — Obsidian theme
  await applyTheme(page, "obsidian");
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await shot(page, "01-counter-obsidian.png");

  // 2. Counter — Emerald theme
  await applyTheme(page, "emerald");
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await shot(page, "02-counter-emerald.png");

  // 3. Zikr library — keep Emerald
  await page.goto(`${BASE_URL}/listes`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await shot(page, "03-zikr-library.png");

  // 4. Stats
  await page.goto(`${BASE_URL}/stats`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await shot(page, "04-stats.png");

  // 5. Counter — Al-Andalus theme
  await applyTheme(page, "al-andalus");
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await shot(page, "05-counter-al-andalus.png");

  await ctx.close();

  // ── Feature graphic (1024×500) ────────────────────────────────────────────
  console.log("\nFeature graphic (1024×500):");
  const fCtx = await browser.newContext({ viewport: FEATURE, deviceScaleFactor: 1 });
  const fPage = await fCtx.newPage();
  fPage.on("console", (m) => { if (m.type() === "error") console.error("  [page error]", m.text()); });
  await fPage.goto(BASE_URL, { waitUntil: "networkidle" });
  await fPage.waitForTimeout(1500);
  await fPage.evaluate(() => {
    const key = "tasbihDigitalStateV1";
    let s = {};
    try { s = JSON.parse(localStorage.getItem(key) || "{}"); } catch {}
    s.preferences = s.preferences || {};
    s.preferences.unlockedThemes = ["obsidian", "emerald", "midnight", "al-andalus"];
    s.preferences.language = "en";
    localStorage.setItem(key, JSON.stringify(s));
  });
  await fPage.reload({ waitUntil: "networkidle" });
  await fPage.waitForTimeout(1000);
  // Click Obsidian via UI
  await fPage.goto(`${BASE_URL}/reglages/themes`, { waitUntil: "networkidle" });
  await fPage.waitForTimeout(800);
  await fPage.getByRole("button", { name: "Obsidian" }).first().click();
  await fPage.waitForTimeout(600);
  await fPage.goto(BASE_URL, { waitUntil: "networkidle" });
  await fPage.waitForTimeout(1200);
  await shot(fPage, "feature-graphic-1024x500.png");
  await fCtx.close();

  await browser.close();
  console.log(`\nDone — screenshots saved to ./${OUT_DIR}/`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
