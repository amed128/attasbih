# Release Notes — Attasbih

---

## 1.0.1 — En cours

### Bug Fixes
- **IAP — Achat des thèmes premium** : Correction du bug critique où le bouton "Acheter" restait bloqué sur "…" indéfiniment. Le pod natif RevenueCat (`RevenuecatPurchasesCapacitor`) était absent du build iOS, empêchant tout appel natif StoreKit de se résoudre.
- **IAP — Feedback visuel** : Le bouton d'achat affiche maintenant l'étape en cours (`Connecting…` / `Loading product…` / `Opening payment…`) au lieu d'un générique "…", et affiche un message d'erreur explicite en cas d'échec ou de timeout.
- **PWA — Thèmes premium** : La section thèmes premium est maintenant masquée sur la version web (PWA) car les achats intégrés ne sont pas disponibles en dehors de l'app native.
- **Build iOS — TypeScript** : Correction de plusieurs erreurs TypeScript (`currentZikrId undefined`, `Partial<TasbihStoreState>`, locale `fa` manquante dans `setLanguage`) qui bloquaient les builds Codemagic.
- **Auto-compteur — Zoom clavier iOS** : En mode auto-compteur, le champ "Vitesse personnalisée" provoquait un zoom indésirable sur iOS à l'apparition du clavier. Le champ inline est remplacé par un popup de saisie (bouton → modal avec Annuler / Confirmer), identique au popup "Modifier la cible".
- **Auto-compteur — Contrôles de vitesse accessibles pendant le comptage** : Le sélecteur de vitesse et le bouton de vitesse personnalisée sont maintenant désactivés et blurés pendant que le compteur automatique tourne, cohérent avec le comportement des autres contrôles. Appliqué sur tous les thèmes (Blue/Dark/Light + 4 thèmes premium).

- **Android — Blink sur les thèmes premium** : Correction du clignotement/instabilité de l'écran lors des taps rapides sur la bille dans les thèmes premium (Émeraude, Obsidienne, Minuit, Al-Andalus). Cause : le compositor GPU d'Android WebView lâchait et re-acquérait le layer animé à chaque tap. Fix : promotion GPU forcée (`willChange: transform`), suppression des listeners Framer Motion sur le tap (conflit avec le dispatch tactile natif Android), et désactivation des ripples CSS sur Android pour éviter les mutations DOM pendant le comptage.
- **iOS — Zoom viewport sur les thèmes Émeraude et Al-Andalus** : Correction d'un dézoom visible lors de taps rapides sur la bille. Cause : les ripples animés étaient à l'intérieur du wrapper `motion.div drag` de Framer Motion ; quand un ripple scalait à 2,5×, Framer Motion recalculait les bounds de ses enfants, forçant un layout pass sur WKWebView qui ajustait brièvement le visual viewport. Fix : déplacement des ripples en dehors du wrapper drag (alignement avec Obsidienne et Minuit qui n'avaient pas le problème).
- **Pinch-to-zoom désactivé** : Le zoom par pincement est maintenant désactivé sur toutes les plateformes et tous les onglets (viewport meta `user-scalable=no`, CSS `touch-action: pan-x pan-y` sur html/body, `setSupportZoom(false)` sur Android WebView, `maximumZoomScale = 1.0` sur le UIScrollView WKWebView iOS).

### Nouvelles fonctionnalités
- **Smart App Banner** : Une bannière apparaît automatiquement sur Safari iOS et Google mobile lors de la visite de attasbih.com, permettant d'ouvrir directement la page App Store.

---

## 1.0.0 — 29 mai 2026 🎉

Première version publique sur l'App Store.

- Compteur de zikr (modes : manuel, décrémental, auto, audio)
- Bibliothèque de 450+ zikrs en 10 catégories
- Listes personnalisées
- Statistiques et historique
- 14 langues (FR, EN, DE, ES, PT, HI, AR, TR, UR, BN, ID, MS, RU, FA)
- 3 thèmes gratuits (Light, Dark, Blue)
- 4 thèmes premium (Émeraude, Obsidienne, Minuit, Al-Andalus)
- Mode Focus
- Notifications de rappel
- Support PWA + iOS natif
