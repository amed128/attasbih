import { registerPlugin } from "@capacitor/core";

export interface SafeAreaInsets {
  top: number;    // status bar height in dp (≈ CSS px)
  bottom: number; // navigation bar height in dp (≈ CSS px)
}

export interface SafeAreaPlugin {
  getInsets(): Promise<SafeAreaInsets>;
}

export const SafeArea = registerPlugin<SafeAreaPlugin>("SafeArea");
