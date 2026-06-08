import type { PremiumTheme } from "../store/attasbihStore";

const RC_API_KEY_IOS = "appl_KCiPkGACoTONMcdzCHvCJLBiPNx";

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

type RCPurchases = typeof import("@revenuecat/purchases-capacitor")["Purchases"];

let rcModule: RCPurchases | null = null;
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

// Imports and caches the RC Purchases singleton. Safe to call multiple times.
async function getRC(): Promise<RCPurchases> {
  if (!rcModule) {
    const { Purchases } = await withTimeout(
      import("@revenuecat/purchases-capacitor"),
      10_000,
      "RC plugin import"
    );
    rcModule = Purchases;
  }
  return rcModule;
}

export async function initRevenueCat(): Promise<void> {
  if (initialized || typeof window === "undefined") return;
  // Deduplicate concurrent calls — only one init runs at a time.
  if (!initPromise) {
    initPromise = (async () => {
      try {
        const Purchases = await getRC();
        await withTimeout(
          Purchases.configure({ apiKey: RC_API_KEY_IOS }),
          10_000,
          "RC configure"
        );
        initialized = true;
      } catch (e) {
        console.error("[RC] init failed:", e);
        initPromise = null; // allow retry on next attempt
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

  const Purchases = await getRC();

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
    const Purchases = await getRC();
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
