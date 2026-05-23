/**
 * Promo video recorder using Playwright.
 * Navigates the live app like a real user — counter taps, theme switch, lists, stats.
 *
 * Usage:
 *   1. npx next start -p 3100   (in another terminal)
 *   2. node scripts/record-promo.mjs
 *
 * Output: screenshots/promo-raw.webm  →  screenshots/promo.mp4 (via ffmpeg)
 */

import { chromium } from "@playwright/test";
import { mkdirSync, renameSync } from "fs";
import { execSync } from "child_process";

const BASE_URL = "http://localhost:3100";
const OUT_DIR  = "screenshots";
mkdirSync(OUT_DIR, { recursive: true });

const VIEWPORT = { width: 390, height: 844 };

async function pause(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  const browser = await chromium.launch({
    args: ["--ignore-certificate-errors"],
  });

  const ctx = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    serviceWorkers: "block",
    recordVideo: {
      dir: OUT_DIR,
      size: VIEWPORT,  // Playwright scales by deviceScaleFactor internally
    },
  });

  const page = await ctx.newPage();
  page.on("console", (m) => {
    if (m.type() === "error") console.error("  [page]", m.text());
  });

  // ── 1. Warm up + unlock premium themes ──────────────────────────────────────
  console.log("Loading app…");
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await pause(1500);

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
  await pause(1200);

  // ── 2. Apply Obsidian theme ──────────────────────────────────────────────────
  console.log("Applying Obsidian theme…");
  await page.goto(`${BASE_URL}/reglages/themes`, { waitUntil: "networkidle" });
  await pause(800);
  await page.getByRole("button", { name: "Obsidian" }).first().click();
  await pause(600);
  const modal = page.locator('[role="dialog"]');
  if (await modal.isVisible({ timeout: 500 }).catch(() => false)) {
    await page.keyboard.press("Escape");
    await pause(300);
  }

  // ── 3. Counter — Obsidian — opening shot ────────────────────────────────────
  console.log("Recording: counter (Obsidian)…");
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await pause(1800); // hold opening shot

  // Find the tap target (large counter circle)
  const tapBtn = page.locator('[aria-label*="sur"], [aria-label*="remaining"], button.rounded-full').first();

  // Tap counter ~12 times with natural rhythm
  const tapDelays = [520, 480, 550, 430, 600, 510, 470, 540, 490, 560, 500, 480];
  for (const delay of tapDelays) {
    await page.tap("main");   // tap anywhere on main — counter handles it
    await pause(delay);
  }
  await pause(1200); // hold after last tap

  // ── 4. Switch to Emerald theme live ─────────────────────────────────────────
  console.log("Recording: theme switch to Emerald…");
  await page.goto(`${BASE_URL}/reglages/themes`, { waitUntil: "networkidle" });
  await pause(1000); // viewer sees the theme grid
  await page.getByRole("button", { name: "Emerald" }).first().click();
  await pause(900);

  // ── 5. Counter — Emerald ─────────────────────────────────────────────────────
  console.log("Recording: counter (Emerald)…");
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await pause(1500);

  const tapDelays2 = [500, 460, 530, 510, 480, 550, 440, 520];
  for (const delay of tapDelays2) {
    await page.tap("main");
    await pause(delay);
  }
  await pause(1000);

  // ── 6. Zikr Library ──────────────────────────────────────────────────────────
  console.log("Recording: zikr library…");
  await page.goto(`${BASE_URL}/listes`, { waitUntil: "networkidle" });
  await pause(1200);

  // Slow scroll down to reveal zikrs
  for (let i = 0; i < 6; i++) {
    await page.mouse.wheel(0, 220);
    await pause(350);
  }
  await pause(1000);

  // Scroll back up
  for (let i = 0; i < 3; i++) {
    await page.mouse.wheel(0, -220);
    await pause(300);
  }
  await pause(800);

  // ── 7. Stats ─────────────────────────────────────────────────────────────────
  console.log("Recording: stats…");
  await page.goto(`${BASE_URL}/stats`, { waitUntil: "networkidle" });
  await pause(2000);

  // Light scroll to show more content
  await page.mouse.wheel(0, 300);
  await pause(700);
  await page.mouse.wheel(0, 300);
  await pause(1200);

  // ── 8. Themes page — show variety ────────────────────────────────────────────
  console.log("Recording: themes showcase…");
  await page.goto(`${BASE_URL}/reglages/themes`, { waitUntil: "networkidle" });
  await pause(1800);

  // Click Al-Andalus
  await page.getByRole("button", { name: "Al-Andalus" }).first().click();
  await pause(800);

  // ── 9. Counter — Al-Andalus — closing shot ───────────────────────────────────
  console.log("Recording: counter (Al-Andalus) closing shot…");
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await pause(1500);

  const tapDelays3 = [540, 500, 460, 520, 480];
  for (const delay of tapDelays3) {
    await page.tap("main");
    await pause(delay);
  }
  await pause(2000); // hold closing shot

  // ── Done — close context to flush video ──────────────────────────────────────
  console.log("Flushing video…");
  const videoPath = await page.video()?.path();
  await ctx.close();
  await browser.close();

  // Rename raw WebM
  const rawWebm = videoPath || `${OUT_DIR}/promo-raw.webm`;
  if (videoPath && videoPath !== `${OUT_DIR}/promo-raw.webm`) {
    renameSync(videoPath, `${OUT_DIR}/promo-raw.webm`);
  }
  console.log(`  WebM saved: ${OUT_DIR}/promo-raw.webm`);

  // ── Convert to MP4 with ffmpeg ────────────────────────────────────────────────
  console.log("Converting to MP4…");
  execSync(
    `ffmpeg -y -i ${OUT_DIR}/promo-raw.webm ` +
    `-vf "scale=780:1688" ` +
    `-c:v libx264 -preset slow -crf 18 ` +
    `-c:a aac -b:a 128k ` +
    `-movflags +faststart ` +
    `${OUT_DIR}/promo.mp4`,
    { stdio: "inherit" }
  );

  console.log(`\nDone! → ${OUT_DIR}/promo.mp4`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
