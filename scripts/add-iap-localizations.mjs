#!/usr/bin/env node
/**
 * Adds IAP localizations for all supported locales via App Store Connect API.
 *
 * Usage:
 *   KEY_ID=XXXXXXXXXX \
 *   ISSUER_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx \
 *   PRIVATE_KEY="$(cat AuthKey_XXXXXXXXXX.p8)" \
 *   node scripts/add-iap-localizations.mjs
 */

import { createSign } from "crypto";

const APP_ID = "6773006469";

const KEY_ID = process.env.KEY_ID ?? process.env.APP_STORE_CONNECT_KEY_IDENTIFIER;
const ISSUER_ID = process.env.ISSUER_ID ?? process.env.APP_STORE_CONNECT_ISSUER_ID;
const PRIVATE_KEY = (process.env.PRIVATE_KEY ?? process.env.APP_STORE_CONNECT_PRIVATE_KEY ?? "")
  .replace(/\\n/g, "\n"); // handle env vars where newlines were escaped

if (!KEY_ID || !ISSUER_ID || !PRIVATE_KEY) {
  console.error("Missing env vars: KEY_ID, ISSUER_ID, PRIVATE_KEY");
  process.exit(1);
}

// App Store Connect locale → { themeKey → { displayName, description } }
const L10N = {
  "fr-FR": {
    emerald:   { displayName: "Thème Émeraude",      description: "Débloquez le thème Émeraude pour personnaliser votre expérience." },
    obsidian:  { displayName: "Thème Obsidienne",    description: "Débloquez le thème Obsidienne pour personnaliser votre expérience." },
    midnight:  { displayName: "Thème Minuit",        description: "Débloquez le thème Minuit pour personnaliser votre expérience." },
    alandalus: { displayName: "Thème Al-Andalous",   description: "Débloquez le thème Al-Andalous pour personnaliser votre expérience." },
  },
  "en-US": {
    emerald:   { displayName: "Emerald Theme",    description: "Unlock the Emerald theme to personalize your experience." },
    obsidian:  { displayName: "Obsidian Theme",   description: "Unlock the Obsidian theme to personalize your experience." },
    midnight:  { displayName: "Midnight Theme",   description: "Unlock the Midnight theme to personalize your experience." },
    alandalus: { displayName: "Al-Andalus Theme", description: "Unlock the Al-Andalus theme to personalize your experience." },
  },
  "de-DE": {
    emerald:   { displayName: "Smaragd-Thema",      description: "Schalten Sie das Smaragd-Thema frei, um Ihr Erlebnis zu personalisieren." },
    obsidian:  { displayName: "Obsidian-Thema",     description: "Schalten Sie das Obsidian-Thema frei, um Ihr Erlebnis zu personalisieren." },
    midnight:  { displayName: "Mitternacht-Thema",  description: "Schalten Sie das Mitternacht-Thema frei, um Ihr Erlebnis zu personalisieren." },
    alandalus: { displayName: "Al-Andalus-Thema",   description: "Schalten Sie das Al-Andalus-Thema frei, um Ihr Erlebnis zu personalisieren." },
  },
  "es-ES": {
    emerald:   { displayName: "Tema Esmeralda",   description: "Desbloquea el tema Esmeralda para personalizar tu experiencia." },
    obsidian:  { displayName: "Tema Obsidiana",   description: "Desbloquea el tema Obsidiana para personalizar tu experiencia." },
    midnight:  { displayName: "Tema Medianoche",  description: "Desbloquea el tema Medianoche para personalizar tu experiencia." },
    alandalus: { displayName: "Tema Al-Ándalus",  description: "Desbloquea el tema Al-Ándalus para personalizar tu experiencia." },
  },
  "pt-BR": {
    emerald:   { displayName: "Tema Esmeralda",   description: "Desbloqueie o tema Esmeralda para personalizar sua experiência." },
    obsidian:  { displayName: "Tema Obsidiana",   description: "Desbloqueie o tema Obsidiana para personalizar sua experiência." },
    midnight:  { displayName: "Tema Meia-noite",  description: "Desbloqueie o tema Meia-noite para personalizar sua experiência." },
    alandalus: { displayName: "Tema Al-Ândalus",  description: "Desbloqueie o tema Al-Ândalus para personalizar sua experiência." },
  },
  "hi": {
    emerald:   { displayName: "एमराल्ड थीम",     description: "अपना अनुभव व्यक्तिगत बनाने के लिए एमराल्ड थीम अनलॉक करें।" },
    obsidian:  { displayName: "ओब्सीडियन थीम",   description: "अपना अनुभव व्यक्तिगत बनाने के लिए ओब्सीडियन थीम अनलॉक करें।" },
    midnight:  { displayName: "मिडनाइट थीम",     description: "अपना अनुभव व्यक्तिगत बनाने के लिए मिडनाइट थीम अनलॉक करें।" },
    alandalus: { displayName: "अल-अंदलुस थीम",   description: "अपना अनुभव व्यक्तिगत बनाने के लिए अल-अंदलुस थीम अनलॉक करें।" },
  },
  "ar-SA": {
    emerald:   { displayName: "ثيم الزمرد",          description: "افتح ثيم الزمرد لتخصيص تجربتك." },
    obsidian:  { displayName: "ثيم الأوبسيديان",     description: "افتح ثيم الأوبسيديان لتخصيص تجربتك." },
    midnight:  { displayName: "ثيم منتصف الليل",     description: "افتح ثيم منتصف الليل لتخصيص تجربتك." },
    alandalus: { displayName: "ثيم الأندلس",         description: "افتح ثيم الأندلس لتخصيص تجربتك." },
  },
  "tr": {
    emerald:   { displayName: "Zümrüt Teması",       description: "Deneyiminizi kişiselleştirmek için Zümrüt temasının kilidini açın." },
    obsidian:  { displayName: "Obsidyen Teması",     description: "Deneyiminizi kişiselleştirmek için Obsidyen temasının kilidini açın." },
    midnight:  { displayName: "Gece Yarısı Teması",  description: "Deneyiminizi kişiselleştirmek için Gece Yarısı temasının kilidini açın." },
    alandalus: { displayName: "Endülüs Teması",      description: "Deneyiminizi kişiselleştirmek için Endülüs temasının kilidini açın." },
  },
  "id": {
    emerald:   { displayName: "Tema Zamrud",         description: "Buka kunci tema Zamrud untuk mempersonalisasi pengalaman Anda." },
    obsidian:  { displayName: "Tema Obsidian",       description: "Buka kunci tema Obsidian untuk mempersonalisasi pengalaman Anda." },
    midnight:  { displayName: "Tema Tengah Malam",   description: "Buka kunci tema Tengah Malam untuk mempersonalisasi pengalaman Anda." },
    alandalus: { displayName: "Tema Al-Andalus",     description: "Buka kunci tema Al-Andalus untuk mempersonalisasi pengalaman Anda." },
  },
  "ms": {
    emerald:   { displayName: "Tema Zamrud",         description: "Buka kunci tema Zamrud untuk mempersonalisasikan pengalaman anda." },
    obsidian:  { displayName: "Tema Obsidian",       description: "Buka kunci tema Obsidian untuk mempersonalisasikan pengalaman anda." },
    midnight:  { displayName: "Tema Tengah Malam",   description: "Buka kunci tema Tengah Malam untuk mempersonalisasikan pengalaman anda." },
    alandalus: { displayName: "Tema Al-Andalus",     description: "Buka kunci tema Al-Andalus untuk mempersonalisasikan pengalaman anda." },
  },
  "ru": {
    emerald:   { displayName: "Тема «Изумруд»",      description: "Откройте тему «Изумруд», чтобы персонализировать ваш опыт." },
    obsidian:  { displayName: "Тема «Обсидиан»",     description: "Откройте тему «Обсидиан», чтобы персонализировать ваш опыт." },
    midnight:  { displayName: "Тема «Полночь»",      description: "Откройте тему «Полночь», чтобы персонализировать ваш опыт." },
    alandalus: { displayName: "Тема «Аль-Андалус»",  description: "Откройте тему «Аль-Андалус», чтобы персонализировать ваш опыт." },
  },
  // ur, bn, fa are not supported as App Store Connect IAP locales
};

const PRODUCT_MAP = {
  "com.attasbih.app.theme.emerald":   "emerald",
  "com.attasbih.app.theme.obsidian":  "obsidian",
  "com.attasbih.app.theme.midnight":  "midnight",
  "com.attasbih.app.theme.alandalus": "alandalus",
};

function generateToken() {
  const now = Math.floor(Date.now() / 1000);
  const header  = Buffer.from(JSON.stringify({ alg: "ES256", kid: KEY_ID, typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ iss: ISSUER_ID, iat: now, exp: now + 1200, aud: "appstoreconnect-v1" })).toString("base64url");
  const msg = `${header}.${payload}`;
  const signer = createSign("SHA256");
  signer.update(msg);
  const sig = signer.sign({ key: PRIVATE_KEY, dsaEncoding: "ieee-p1363" }).toString("base64url");
  return `${msg}.${sig}`;
}

async function asc(method, path, body) {
  const res = await fetch(`https://api.appstoreconnect.apple.com${path}`, {
    method,
    headers: { Authorization: `Bearer ${generateToken()}`, "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${await res.text()}`);
  return res.status === 204 ? null : res.json();
}

async function main() {
  const { data: iaps } = await asc("GET", `/v1/apps/${APP_ID}/inAppPurchasesV2?limit=50`);
  console.log(`Found ${iaps.length} IAPs\n`);

  for (const iap of iaps) {
    const productId = iap.attributes.productId;
    const themeKey  = PRODUCT_MAP[productId];
    if (!themeKey) { console.log(`Skipping unknown product: ${productId}`); continue; }

    const { data: existing } = await asc("GET", `/v1/inAppPurchasesV2/${iap.id}/inAppPurchaseLocalizations`);
    const existingLocales = new Set(existing.map((l) => l.attributes.locale));

    for (const [locale, themes] of Object.entries(L10N)) {
      if (existingLocales.has(locale)) {
        console.log(`  skip  ${productId} [${locale}] — already exists`);
        continue;
      }
      const { displayName, description } = themes[themeKey];
      await asc("POST", "/v1/inAppPurchaseLocalizations", {
        data: {
          type: "inAppPurchaseLocalizations",
          attributes: { locale, displayName, description },
          relationships: { inAppPurchaseV2: { data: { type: "inAppPurchasesV2", id: iap.id } } },
        },
      });
      console.log(`  ✓     ${productId} [${locale}] → ${displayName}`);
    }
  }
  console.log("\nDone.");
}

main().catch((e) => { console.error(e.message); process.exit(1); });
