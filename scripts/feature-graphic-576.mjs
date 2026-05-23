/**
 * Generates a 1024×576 feature graphic via custom HTML (centered dark design).
 * Output: screenshots/feature-graphic-1024x576.png
 *
 * Usage: node scripts/feature-graphic-576.mjs
 */

import { chromium } from "@playwright/test";
import { mkdirSync } from "fs";

const OUT_DIR = "screenshots";
mkdirSync(OUT_DIR, { recursive: true });

const W = 1024, H = 576;

// Build tick marks and bead dots as SVG strings
const ticks = Array.from({ length: 60 }, (_, i) => {
  const a = (i * 6) * Math.PI / 180;
  const r1 = 218, r2 = i % 5 === 0 ? 204 : 211;
  const cx = 512, cy = 288;
  return `<line x1="${(cx + r1 * Math.cos(a)).toFixed(2)}" y1="${(cy + r1 * Math.sin(a)).toFixed(2)}" x2="${(cx + r2 * Math.cos(a)).toFixed(2)}" y2="${(cy + r2 * Math.sin(a)).toFixed(2)}" stroke="rgba(228,177,90,0.18)" stroke-width="1"/>`;
}).join("");

const beads = Array.from({ length: 33 }, (_, i) => {
  const a = (i * (360 / 33) - 90) * Math.PI / 180;
  const r = 158, cx = 512, cy = 288;
  const x = (cx + r * Math.cos(a)).toFixed(2);
  const y = (cy + r * Math.sin(a)).toFixed(2);
  return `<circle cx="${x}" cy="${y}" r="${i === 0 ? 5 : 3}" fill="${i === 0 ? '#E4B15A' : 'rgba(228,177,90,0.45)'}"/>`;
}).join("");

const HTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body {
    width: ${W}px; height: ${H}px;
    overflow: hidden;
    background: #0D0D10;
  }
  svg { position: absolute; inset: 0; }
  .center {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0;
    font-family: -apple-system, 'Helvetica Neue', sans-serif;
    text-align: center;
  }
  .dots {
    display: flex; gap: 10px; margin-bottom: 18px;
  }
  .dot { width: 6px; height: 6px; border-radius: 50%; background: #E4B15A; opacity: 0.8; }
  .title {
    font-size: 52px; font-weight: 700;
    color: #F5F0E8; letter-spacing: -0.02em;
    line-height: 1; margin-bottom: 10px;
  }
  .arabic {
    font-size: 30px; font-weight: 500;
    color: #E4B15A; margin-bottom: 18px;
    direction: rtl;
  }
  .tagline {
    font-size: 11.5px; font-weight: 500;
    letter-spacing: 0.18em; text-transform: uppercase;
    color: rgba(245,240,232,0.38);
  }
</style>
</head>
<body>

<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <!-- radial glow -->
  <radialGradient id="glow" cx="50%" cy="50%" r="50%">
    <stop offset="0%"   stop-color="#3A2A0A" stop-opacity="0.55"/>
    <stop offset="100%" stop-color="#0D0D10" stop-opacity="0"/>
  </radialGradient>
  <ellipse cx="512" cy="288" rx="270" ry="260" fill="url(#glow)"/>

  <!-- rings -->
  <circle cx="512" cy="288" r="240" stroke="rgba(228,177,90,0.05)" stroke-width="1" fill="none"/>
  <circle cx="512" cy="288" r="218" stroke="rgba(228,177,90,0.09)" stroke-width="1" fill="none"/>
  <circle cx="512" cy="288" r="190" stroke="rgba(228,177,90,0.13)" stroke-width="1.5" fill="none"/>
  <circle cx="512" cy="288" r="158" stroke="rgba(228,177,90,0.20)" stroke-width="1.5" fill="none"/>
  <circle cx="512" cy="288" r="120" stroke="rgba(228,177,90,0.28)" stroke-width="2" fill="none"/>

  <!-- tick marks on 218 ring -->
  ${ticks}

  <!-- 33 bead dots on 158 ring -->
  ${beads}
</svg>

<div class="center">
  <div class="dots"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>
  <div class="title">At-tasbih</div>
  <div class="arabic">التسبيح</div>
  <div class="tagline">Dhikr counter &middot; 14 languages &middot; No ads</div>
</div>

</body>
</html>`;

async function run() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: W, height: H },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();
  await page.setContent(HTML, { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  await page.screenshot({
    path: `${OUT_DIR}/feature-graphic-1024x576.png`,
    fullPage: false,
    clip: { x: 0, y: 0, width: W, height: H },
  });
  await browser.close();
  console.log(`Done → ${OUT_DIR}/feature-graphic-1024x576.png`);
}

run().catch((err) => { console.error(err); process.exit(1); });
