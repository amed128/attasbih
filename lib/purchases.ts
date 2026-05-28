import type { PremiumTheme } from "../store/attasbihStore";

// RevenueCat public API keys (not secret — safe to ship in client code)
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

async function getRC() {
  const { Purchases } = await import("@revenuecat/purchases-capacitor");
  return Purchases;
}

export async function initRevenueCat(): Promise<void> {
  if (initialized || typeof window === "undefined") return;
  try {
    const Purchases = await getRC();
    await Purchases.configure({ apiKey: RC_API_KEY_IOS });
    initialized = true;
  } catch {
    // Not available on web — silently skip
  }
}

export async function purchaseTheme(theme: PremiumTheme): Promise<boolean> {
  await initRevenueCat();
  if (!initialized) throw new Error("RevenueCat not available on this platform");
  try {
    const Purchases = await getRC();
    const { customerInfo } = await Purchases.purchaseStoreProduct({
      product: await getProduct(theme),
    });
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
    const { customerInfo } = await Purchases.restorePurchases();
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
  const { products } = await Purchases.getProducts({
    productIdentifiers: [PRODUCT_ID[theme]],
  });
  if (!products.length) throw new Error(`Product not found: ${PRODUCT_ID[theme]}`);
  return products[0];
}
