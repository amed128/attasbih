/**
 * Automated store screenshots using Playwright.
 * Captures the live site (attasbih.com) with different themes.
 *
 * Usage:  node scripts/take-screenshots.mjs
 * Output: screenshots/ directory
 *
 * Generates:
 *   - 5 phone screenshots (1080×1920) for Play Store / App Store screenshots section
 *   - 1 feature graphic (1024×500) for Google Play feature graphic
 */

import { chromium } from "@playwright/test";
import { mkdirSync } from "fs";

const BASE_URL = "https://attasbih.com";
const OUT_DIR = "screenshots";
mkdirSync(OUT_DIR, { recursive: true });

const PHONE = { width: 1080, height: 1920 };
const FEATURE = { width: 1024, height: 500 };

function storeState(theme) {
  return JSON.stringify({
    preferences: {
      theme,
      unlockedThemes: ["obsidian", "emerald", "midnight", "al-andalus"],
      language: "en",
    },
  });
}

async function setTheme(page, theme) {
  await page.evaluate(
    ([key, value]) => localStorage.setItem(key, value),
    ["tasbihDigitalStateV1", storeState(theme)]
  );
  await page.reload({ waitUntil: "networkidle" });
  // Wait for hydration
  await page.waitForTimeout(800);
}

async function shot(page, filename) {
  await page.screenshot({ path: `${OUT_DIR}/${filename}`, fullPage: false });
  console.log(`  ✓ ${filename}`);
}

async function run() {
  const browser = await chromium.launch({ args: ["--ignore-certificate-errors"] });

  // ── Phone screenshots (1080×1920) ────────────────────────────────────────
  console.log("\nPhone screenshots (1080×1920):");
  const phone = await browser.newPage();
  await phone.setViewportSize(PHONE);

  // 1. Counter — Obsidian theme
  await phone.goto(BASE_URL, { waitUntil: "networkidle" });
  await setTheme(phone, "obsidian");
  await shot(phone, "01-counter-obsidian.png");

  // 2. Counter — Emerald theme
  await setTheme(phone, "emerald");
  await shot(phone, "02-counter-emerald.png");

  // 3. Zikr library
  await phone.goto(`${BASE_URL}/listes`, { waitUntil: "networkidle" });
  await phone.waitForTimeout(600);
  await shot(phone, "03-zikr-library.png");

  // 4. Stats
  await phone.goto(`${BASE_URL}/stats`, { waitUntil: "networkidle" });
  await phone.waitForTimeout(600);
  await shot(phone, "04-stats.png");

  // 5. Counter — Al-Andalus theme
  await phone.goto(BASE_URL, { waitUntil: "networkidle" });
  await setTheme(phone, "al-andalus");
  await shot(phone, "05-counter-al-andalus.png");

  // ── Feature graphic (1024×500) ────────────────────────────────────────────
  console.log("\nFeature graphic (1024×500):");
  const feature = await browser.newPage();
  await feature.setViewportSize(FEATURE);
  await feature.goto(BASE_URL, { waitUntil: "networkidle" });
  await setTheme(feature, "obsidian");
  await shot(feature, "feature-graphic-1024x500.png");

  await browser.close();
  console.log(`\nDone — screenshots saved to ./${OUT_DIR}/`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
