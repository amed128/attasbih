# Release Notes — Attasbih

---

## 1.0.2 — Live App Store ✅

### Bug Fixes
- **IAP — Achat des thèmes premium (correctif définitif)** : Correction du blocage persistant sur "Connecting…" malgré le pod RevenueCat présent. Cause racine : `import()` dynamique de `@revenuecat/purchases-capacitor` bloquait le thread JavaScript dans WKWebView lors du chargement du chunk via le scheme `capacitor://`, empêchant tous les `setTimeout` (dont le timeout de 10 s) de s'exécuter. Fix : import statique en tête de module — le SDK RevenueCat est désormais inclus dans le bundle principal, sans chargement asynchrone de chunk au moment de l'achat.
- **IAP — Réinitialisation des réglages** : La fonction "Restaurer les réglages par défaut" ne supprime plus les thèmes premium achetés. `unlockedThemes` est désormais préservé lors d'un reset (seule une désinstallation de l'app efface les achats ; la restauration via RevenueCat reste disponible après réinstallation).
- **Listes — Saisie du zikr personnel** : Correction du bug où le focus quittait le champ de saisie après chaque caractère, obligeant à retaper sur le champ. Deux causes : (1) le composant Modal relançait sa gestion du focus à chaque re-render à cause d'une dépendance instable sur `onClose` ; (2) l'apparition/disparition de la suggestion d'autocomplétion entre les deux champs provoquait un layout shift qui dismissait le clavier sur iOS. Les deux sont corrigés.
- **Listes — Prévisualisation des zikrs dans la bibliothèque** : Lors de la création ou édition d'une liste personnelle, taper sur un zikr dans la bibliothèque ouvre maintenant une prévisualisation (nom arabe, translittération, cible). Le bouton `+` reste le seul moyen d'ajouter le zikr à la liste.

### Améliorations
- **Vibration — Choix de l'intensité haptique** : Le simple toggle On/Off est remplacé par un sélecteur à 5 niveaux : Off · Légère · Moyenne · Forte · Double tick (notification iOS). Chaque niveau correspond à un feedback natif distinct (`UIImpactFeedbackGenerator` light/medium/heavy ou `UINotificationFeedbackGenerator` success). Le paramètre précédent est migré automatiquement (Off → Off, On → Moyenne).

---

## 1.0.1 — Live App Store ✅

### Bug Fixes
- **IAP — Achat des thèmes premium** : Correction du bug critique où le bouton "Acheter" restait bloqué sur "…" indéfiniment. Le pod natif RevenueCat (`RevenuecatPurchasesCapacitor`) était absent du build iOS, empêchant tout appel natif StoreKit de se résoudre.
- **IAP — Feedback visuel** : Le bouton d'achat affiche maintenant l'étape en cours (`Connecting…` / `Loading product…` / `Opening payment…`) au lieu d'un générique "…", et affiche un message d'erreur explicite en cas d'échec ou de timeout.
- **PWA — Thèmes premium** : La section thèmes premium est maintenant masquée sur la version web (PWA) car les achats intégrés ne sont pas disponibles en dehors de l'app native.
- **Build iOS — TypeScript** : Correction de plusieurs erreurs TypeScript (`currentZikrId undefined`, `Partial<TasbihStoreState>`, locale `fa` manquante dans `setLanguage`) qui bloquaient les builds Codemagic.
- **Auto-compteur — Zoom clavier iOS** : En mode auto-compteur, le champ "Vitesse personnalisée" provoquait un zoom indésirable sur iOS à l'apparition du clavier. Le champ inline est remplacé par un popup de saisie (bouton → modal avec Annuler / Confirmer), identique au popup "Modifier la cible".
- **Auto-compteur — Contrôles de vitesse accessibles pendant le comptage** : Le sélecteur de vitesse et le bouton de vitesse personnalisée sont maintenant désactivés et blurés pendant que le compteur automatique tourne, cohérent avec le comportement des autres contrôles. Appliqué sur tous les thèmes (Blue/Dark/Light + 4 thèmes premium).

- **Android — Blink sur les thèmes premium** : Correction du clignotement/instabilité de l'écran lors des taps rapides sur la bille dans les thèmes premium (Émeraude, Obsidienne, Minuit, Al-Andalus). Cause : le compositor GPU d'Android WebView lâchait et re-acquérait le layer animé à chaque tap. Fix : promotion GPU forcée (`willChange: transform`), suppression des listeners Framer Motion sur le tap (conflit avec le dispatch tactile natif Android), et désactivation des ripples CSS sur Android pour éviter les mutations DOM pendant le comptage.
- **iOS — Zoom viewport sur les thèmes Émeraude et Al-Andalus** : Correction d'un dézoom visible lors de taps rapides sur la bille. Cause : les ripples animés étaient à l'intérieur du wrapper `motion.div drag` de Framer Motion ; quand un ripple scalait à 2,5×, Framer Motion recalculait les bounds de ses enfants, forçant un layout pass sur WKWebView qui ajustait brièvement le visual viewport. Fix : déplacement des ripples en dehors du wrapper drag (alignement avec Obsidienne et Minuit qui n'avaient pas le problème).
- **Pinch-to-zoom désactivé** : Le zoom par pincement est maintenant désactivé sur toutes les plateformes et tous les onglets (viewport meta `user-scalable=no`, CSS wildcard `* { touch-action: pan-x pan-y }` sur tous les éléments DOM, `setSupportZoom(false)` sur Android WebView). La propriété `touch-action` n'étant pas héritée en CSS, le fix s'applique via un sélecteur universel pour couvrir les conteneurs scrollables (onglet Listes, dropdowns).

### Améliorations
- **Sélection de texte désactivée** : Un appui long ne déclenche plus la sélection de texte sur l'interface. Les champs de saisie (`input`, `textarea`) restent bien sûr sélectionnables.

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
