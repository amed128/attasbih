/**
 * Automated store screenshots using Playwright.
 * Captures the live site (attasbih.com) with different themes.
 *
 * Usage:  node scripts/take-screenshots.mjs
 * Output: screenshots/ directory
 *
 * Generates:
 *   - 5 phone screenshots for Play Store / App Store screenshots section
 *   - 1 feature graphic (1024×500) for Google Play feature graphic
 */

import { chromium } from "@playwright/test";
import { mkdirSync } from "fs";

const BASE_URL = "http://localhost:3100";
const OUT_DIR = "screenshots";
mkdirSync(OUT_DIR, { recursive: true });

// 390×844 at 2x → 780×1688 px output (valid for both stores, less zoomed)
const PHONE_VIEWPORT = { width: 390, height: 844 };
const PHONE_SCALE = 2;

const FEATURE = { width: 1024, height: 500 };
const PREMIUM_THEMES = ["obsidian", "emerald", "midnight", "al-andalus"];

function buildState(theme) {
  return ([key, theme, premiumThemes]) => {
    let existing = {};
    try { existing = JSON.parse(localStorage.getItem(key) || "{}"); } catch {}
    localStorage.setItem(key, JSON.stringify({
      ...existing,
      preferences: {
        ...(existing.preferences || {}),
        theme,
        unlockedThemes: premiumThemes,
        language: "en",
      },
    }));
  };
}

async function setTheme(page, theme) {
  await page.evaluate(
    ([key, theme, premiumThemes]) => {
      let existing = {};
      try { existing = JSON.parse(localStorage.getItem(key) || "{}"); } catch {}
      localStorage.setItem(key, JSON.stringify({
        ...existing,
        preferences: {
          ...(existing.preferences || {}),
          theme,
          unlockedThemes: premiumThemes,
          language: "en",
        },
      }));
    },
    ["tasbihDigitalStateV1", theme, PREMIUM_THEMES]
  );
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
}

async function goTo(page, path) {
  await page.goto(`${BASE_URL}${path}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
}

async function shot(page, filename) {
  // Scroll to top to ensure clean screenshot
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
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  });

  const page = await ctx.newPage();

  // Log console errors for debugging
  page.on("console", (msg) => {
    if (msg.type() === "error") console.error("  [page error]", msg.text());
  });

  // Warm up — let the app fully initialize
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);

  // 1. Counter — Obsidian theme
  await setTheme(page, "obsidian");
  await shot(page, "01-counter-obsidian.png");

  // 2. Counter — Emerald theme
  await setTheme(page, "emerald");
  await shot(page, "02-counter-emerald.png");

  // 3. Zikr library — keep Emerald theme
  await goTo(page, "/listes");
  await shot(page, "03-zikr-library.png");

  // 4. Stats
  await goTo(page, "/stats");
  await shot(page, "04-stats.png");

  // 5. Counter — Al-Andalus theme
  await goTo(page, "/");
  await setTheme(page, "al-andalus");
  await shot(page, "05-counter-al-andalus.png");

  await ctx.close();

  // ── Feature graphic (1024×500) ────────────────────────────────────────────
  console.log("\nFeature graphic (1024×500):");
  const fCtx = await browser.newContext({ viewport: FEATURE, deviceScaleFactor: 1 });
  const fPage = await fCtx.newPage();
  fPage.on("console", (msg) => {
    if (msg.type() === "error") console.error("  [page error]", msg.text());
  });
  await fPage.goto(BASE_URL, { waitUntil: "networkidle" });
  await fPage.waitForTimeout(2000);
  await fPage.evaluate(
    ([key, theme, premiumThemes]) => {
      let existing = {};
      try { existing = JSON.parse(localStorage.getItem(key) || "{}"); } catch {}
      localStorage.setItem(key, JSON.stringify({
        ...existing,
        preferences: { ...(existing.preferences || {}), theme, unlockedThemes: premiumThemes, language: "en" },
      }));
    },
    ["tasbihDigitalStateV1", "obsidian", PREMIUM_THEMES]
  );
  await fPage.reload({ waitUntil: "networkidle" });
  await fPage.waitForTimeout(2500);
  await shot(fPage, "feature-graphic-1024x500.png");
  await fCtx.close();

  await browser.close();
  console.log(`\nDone — screenshots saved to ./${OUT_DIR}/`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
