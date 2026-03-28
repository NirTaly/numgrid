# Shmiloku — PWA to Native App Migration Plan

## Recommendation: Capacitor (95% code reuse, both platforms)

### Why Capacitor

| Option | Code Reuse | Dev Days | Cost | iOS Support |
|--------|-----------|----------|------|-------------|
| **Capacitor** | **95%** | **5-8** | **$25 + $99/yr** | **Yes** |
| TWA (Trusted Web Activity) | 100% | 1-2 | $25 | No (Android only) |
| PWABuilder | 100% | 1 | $25 + $99/yr | Risky (Apple rejects) |
| React Native rewrite | 15% | 20-30 | $25 + $99/yr | Yes |
| Flutter rewrite | 0% | 25-35 | $25 + $99/yr | Yes |
| Kotlin + Swift native | 0% | 40-60 | $25 + $99/yr | Yes |

Capacitor wraps your existing `src/` directory in a native shell. All HTML/CSS/JS
stays the same. You get full native API access (haptics, splash screen, push
notifications, in-app purchase) via plugins.

---

## Phase 0: Store Preparation (Day 1)

### Required assets (both stores)
- App icon: **1024x1024 PNG** (generate 192x192, 512x512 variants)
- Screenshots: at least 2 per device size (phone portrait)
- Feature graphic (Google Play): 1024x500 PNG
- Short description (80 chars): "Number puzzle game with irregular regions"
- Full description (4000 chars)
- Privacy policy URL (host on Cloudflare Pages — even "we collect no data" needs a page)

### Update manifest.json
Replace inline SVG data URIs with real PNG icon files.

---

## Phase 1: Android via Capacitor (Days 2-5)

### Step 1: Initialize
```bash
cd /auto/swgwork2/ntaly/tmp/oneup-game
npm init -y
npm install @capacitor/core @capacitor/cli
npx cap init "Shmiloku" "com.shmiloku.puzzle" --web-dir src
```

### Step 2: Add Android
```bash
npm install @capacitor/android
npx cap add android
```

### Step 3: Add plugins
```bash
npm install @capacitor/splash-screen @capacitor/status-bar @capacitor/haptics
```

### Step 4: Minimal code changes
Only change needed in `sw-register.js`:
```javascript
if ('serviceWorker' in navigator && !window.Capacitor) {
    navigator.serviceWorker.register('./sw.js').catch(function() {});
}
```

### Step 5: Build
```bash
npx cap sync android
npx cap open android   # Opens Android Studio
```
In Android Studio: set icon, splash screen, build signed AAB.

### Step 6: Google Play submission
- Register: **$25 one-time** at https://play.google.com/console
- Create app → fill listing → upload AAB
- Content rating: "Everyone" (IARC questionnaire)
- Data safety: "No data collected"
- Review: 1-3 days

---

## Phase 2: iOS via Capacitor (Days 6-8)

### Step 1: Add iOS
```bash
npm install @capacitor/ios
npx cap add ios
npx cap sync ios
npx cap open ios   # Opens Xcode
```

### Step 2: Xcode config
- Deployment target: iOS 16.0
- App icons via Asset Catalog (1024x1024 PNG)
- Automatic signing with Apple Developer account

### Step 3: App Store submission
- Register: **$99/year** at https://developer.apple.com
- App Store Connect → create app → metadata + screenshots
- Privacy: "Data Not Collected"
- Review: 24-48 hours

### Apple rejection risk: LOW
Justification: 408 puzzles, 4 grid sizes, 3 difficulties, notes/undo/redo/hints,
3 languages, dark mode, offline play. Far exceeds "minimum functionality" (Guideline 4.2).

---

## Phase 3: Post-Launch (Days 9+)

### Monetization options
1. **Free + optional ads** — AdMob interstitial every N completions (~$1-5/day)
2. **Free + premium unlock** — in-app purchase to remove ads or unlock extra packs
3. **Completely free** — maximize distribution

### Future features via Capacitor plugins
- Push notifications: `@capacitor/push-notifications` + Firebase
- Analytics: `@capacitor-firebase/analytics` (free)
- Live updates: `@capgo/capacitor-updater` (skip store review for web-only changes)
- Rate prompt: `@capacitor/app` (request review)

---

## Update Workflow

```
Edit src/ → npx cap sync → Build in Android Studio / Xcode → Submit
         ↘ git push → Cloudflare auto-deploys PWA (instant)
```

Web-only changes update the PWA instantly. Native builds only needed
for plugin changes or store metadata updates.

---

## Cost Summary

| Item | One-time | Annual |
|------|----------|--------|
| Google Play registration | $25 | $0 |
| Apple Developer Program | — | $99 |
| Capacitor + plugins | Free | Free |
| Cloudflare Pages (PWA) | Free | Free |
| **Total** | **$25** | **$99** |

---

## Project Structure After Migration

```
oneup-game/
├── src/                    # Shared web code (PWA + native)
├── android/                # Capacitor Android project
├── ios/                    # Capacitor iOS project
├── capacitor.config.ts     # Capacitor config
├── package.json            # npm deps
├── tools/                  # Puzzle generator + validator
├── puzzles/                # Raw puzzle JSON
└── docs/                   # Architecture + this plan
```
