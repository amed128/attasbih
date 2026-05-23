/**
 * Generates a 1024×576 feature graphic by screenshotting the live app.
 * Output: screenshots/feature-graphic-1024x576.png
 *
 * Usage:
 *   1. npx next start -p 3100   (already running)
 *   2. node scripts/feature-graphic-576.mjs
 */

import { chromium } from "@playwright/test";
import { mkdirSync } from "fs";

const BASE_URL = "http://localhost:3100";
const OUT_DIR  = "screenshots";
mkdirSync(OUT_DIR, { recursive: true });

async function run() {
  const browser = await chromium.launch({ args: ["--ignore-certificate-errors"] });

  const ctx = await browser.newContext({
    viewport: { width: 1024, height: 576 },
    deviceScaleFactor: 2,
    serviceWorkers: "block",
  });

  const page = await ctx.newPage();

  // Load app and unlock premium themes
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

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

  // Apply Obsidian theme via UI
  await page.goto(`${BASE_URL}/reglages/themes`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.getByRole("button", { name: "Obsidian" }).first().click();
  await page.waitForTimeout(600);
  const modal = page.locator('[role="dialog"]');
  if (await modal.isVisible({ timeout: 500 }).catch(() => false)) {
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
  }

  // Navigate to counter and screenshot
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(200);

  await page.screenshot({
    path: `${OUT_DIR}/feature-graphic-1024x576.png`,
    fullPage: false,
  });

  await browser.close();
  console.log(`Done → ${OUT_DIR}/feature-graphic-1024x576.png`);
}

run().catch((err) => { console.error(err); process.exit(1); });
