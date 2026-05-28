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

let initialized = false;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms)
    ),
  ]);
}

async function getRC() {
  const { Purchases } = await import("@revenuecat/purchases-capacitor");
  return Purchases;
}

export async function initRevenueCat(): Promise<void> {
  if (initialized || typeof window === "undefined") return;
  try {
    const Purchases = await getRC();
    await withTimeout(Purchases.configure({ apiKey: RC_API_KEY_IOS }), 8_000, "RC init");
    initialized = true;
  } catch (e) {
    console.warn("[RC] init failed:", e);
  }
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
  const product = await withTimeout(
    getProduct(theme),
    12_000,
    "Fetching product"
  );

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

async function getProduct(theme: PremiumTheme) {
  const Purchases = await getRC();
  const { products } = await withTimeout(
    Purchases.getProducts({ productIdentifiers: [PRODUCT_ID[theme]] }),
    12_000,
    "Get product"
  );
  if (!products.length) throw new Error(`Product not found (${PRODUCT_ID[theme]})`);
  return products[0];
}
