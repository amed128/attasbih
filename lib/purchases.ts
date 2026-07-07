import { Capacitor } from "@capacitor/core";
import { Purchases } from "@revenuecat/purchases-capacitor";
import type { PremiumTheme } from "../store/attasbihStore";

const RC_API_KEY_IOS = "appl_KCiPkGACoTONMcdzCHvCJLBiPNx";
const RC_API_KEY_ANDROID = "goog_IjhmyWatCeqRzakPMnDRTUdWdcL";

function getRevenueCatApiKey(): string {
  return Capacitor.getPlatform() === "android" ? RC_API_KEY_ANDROID : RC_API_KEY_IOS;
}

const PRODUCT_ID: Record<PremiumTheme, string> = {
  emerald: "com.attasbih.app.theme.emerald",
  obsidian: "com.attasbih.app.theme.obsidian",
  midnight: "com.attasbih.app.theme.midnight",
  "al-andalus": "com.attasbih.app.theme.alandalus",
};

const ENTITLEMENT_ID: Record<PremiumTheme, string> = {
  emerald: "theme.emerald",
  obsidian: "theme.obsidian",
  midnight: "theme.midnight",
  "al-andalus": "theme.alandalus",
};

let initialized = false;
let initPromise: Promise<void> | null = null;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms)
    ),
  ]);
}

export async function initRevenueCat(): Promise<void> {
  if (initialized || typeof window === "undefined") return;
  if (!initPromise) {
    initPromise = (async () => {
      try {
        await withTimeout(
          Purchases.configure({ apiKey: getRevenueCatApiKey() }),
          10_000,
          "RC configure"
        );
        initialized = true;
      } catch (e) {
        console.error("[RC] init failed:", e);
        initPromise = null;
        throw e;
      }
    })();
  }
  return initPromise;
}

export type PurchaseStep = "init" | "product" | "payment";

export async function purchaseTheme(
  theme: PremiumTheme,
  onStep?: (step: PurchaseStep) => void
): Promise<boolean> {
  onStep?.("init");
  await initRevenueCat();
  if (!initialized) throw new Error("RevenueCat unavailable — please check your connection and try again");

  onStep?.("product");
  const { products } = await withTimeout(
    Purchases.getProducts({ productIdentifiers: [PRODUCT_ID[theme]] }),
    12_000,
    "Fetching product"
  );
  if (!products.length) throw new Error(`Product not found (${PRODUCT_ID[theme]})`);
  const product = products[0];

  onStep?.("payment");
  try {
    const { customerInfo } = await withTimeout(
      Purchases.purchaseStoreProduct({ product }),
      90_000,
      "Payment"
    );
    return !!customerInfo.entitlements.active[ENTITLEMENT_ID[theme]];
  } catch (e: unknown) {
    const err = e as { userCancelled?: boolean };
    if (err?.userCancelled) return false;
    throw e;
  }
}

export async function restorePurchases(): Promise<PremiumTheme[]> {
  await initRevenueCat();
  if (!initialized) return [];
  try {
    const { customerInfo } = await withTimeout(Purchases.restorePurchases(), 15_000, "Restore");
    const unlocked: PremiumTheme[] = [];
    for (const theme of Object.keys(ENTITLEMENT_ID) as PremiumTheme[]) {
      if (customerInfo.entitlements.active[ENTITLEMENT_ID[theme]]) {
        unlocked.push(theme);
      }
    }
    return unlocked;
  } catch {
    return [];
  }
}
