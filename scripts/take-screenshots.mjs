/**
 * Automated store screenshots using Playwright.
 * Captures the live site (attasbih.com) with different themes.
 *
 * Usage:  node scripts/take-screenshots.mjs
 * Output: screenshots/ directory
 *
 * Generates:
 *   - 5 phone screenshots (~1170×2532) for Play Store / App Store screenshots section
 *   - 1 feature graphic (1024×500) for Google Play feature graphic
 */

import { chromium } from "@playwright/test";
import { mkdirSync } from "fs";

const BASE_URL = "https://attasbih.com";
const OUT_DIR = "screenshots";
mkdirSync(OUT_DIR, { recursive: true });

// Simulates iPhone 14 Pro at 3x — outputs 1179×2556 px
const PHONE_VIEWPORT = { width: 393, height: 852 };
const PHONE_SCALE = 3;

const FEATURE = { width: 1024, height: 500 };

const PREMIUM_THEMES = ["obsidian", "emerald", "midnight", "al-andalus"];

async function setTheme(page, theme) {
  await page.evaluate(
    ([key, theme, premiumThemes]) => {
      // Merge into existing state to avoid wiping required fields
      let existing = {};
      try { existing = JSON.parse(localStorage.getItem(key) || "{}"); } catch {}
      const updated = {
        ...existing,
        preferences: {
          ...(existing.preferences || {}),
          theme,
          unlockedThemes: premiumThemes,
          language: "en",
        },
      };
      localStorage.setItem(key, JSON.stringify(updated));
    },
    ["tasbihDigitalStateV1", theme, PREMIUM_THEMES]
  );
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
}

async function shot(page, filename) {
  await page.screenshot({ path: `${OUT_DIR}/${filename}`, fullPage: false });
  console.log(`  ✓ ${filename}`);
}

async function run() {
  const browser = await chromium.launch({ args: ["--ignore-certificate-errors"] });

  // ── Phone screenshots ─────────────────────────────────────────────────────
  console.log("\nPhone screenshots (iPhone 14 Pro scale — ~1179×2556 px):");
  const phone = await browser.newPage();
  await phone.setViewportSize(PHONE_VIEWPORT);
  // deviceScaleFactor must be set at context level — recreate context
  await phone.close();

  const ctx = await browser.newContext({
    viewport: PHONE_VIEWPORT,
    deviceScaleFactor: PHONE_SCALE,
    isMobile: true,
    hasTouch: true,
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  });

  const page = await ctx.newPage();

  // Warm up — let the app fully initialize with default state first
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  // 1. Counter — Obsidian theme
  await setTheme(page, "obsidian");
  await shot(page, "01-counter-obsidian.png");

  // 2. Counter — Emerald theme
  await setTheme(page, "emerald");
  await shot(page, "02-counter-emerald.png");

  // 3. Zikr library — Emerald theme (keep same theme)
  await page.goto(`${BASE_URL}/listes`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await shot(page, "03-zikr-library.png");

  // 4. Stats
  await page.goto(`${BASE_URL}/stats`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await shot(page, "04-stats.png");

  // 5. Counter — Al-Andalus theme
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await setTheme(page, "al-andalus");
  await shot(page, "05-counter-al-andalus.png");

  await ctx.close();

  // ── Feature graphic (1024×500) ────────────────────────────────────────────
  console.log("\nFeature graphic (1024×500):");
  const fCtx = await browser.newContext({
    viewport: FEATURE,
    deviceScaleFactor: 1,
  });
  const fPage = await fCtx.newPage();
  await fPage.goto(BASE_URL, { waitUntil: "networkidle" });
  await fPage.waitForTimeout(800);
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
  await fPage.waitForTimeout(1000);
  await shot(fPage, "feature-graphic-1024x500.png");
  await fCtx.close();

  await browser.close();
  console.log(`\nDone — screenshots saved to ./${OUT_DIR}/`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
