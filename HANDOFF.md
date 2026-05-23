# Adobe Mint — Product & Engineering Handoff

> **Snap. Mint. Earn.** — Turn your camera roll into a money-minting machine on Adobe Stock.

---

## 1. Product Overview

Adobe Mint helps everyday smartphone users monetize their camera roll through Adobe Stock. Users select photos, AI generates stock-ready metadata, and photos are submitted directly to Adobe Stock's global marketplace.

**Target Market:** 150–200M mobile-first creators in India, Southeast Asia, and LATAM — regions driving 60% of new smartphone-led content creation.

**Core Value Prop:** Zero friction path from camera roll → Adobe Stock submission → passive income.

---

## 2. User Flow

```
Onboarding
    ↓
Camera Roll Browse  ──→  Swipe to Mint (Tinder-style select/skip)
    ↓
AI Tagging Screen  (auto-generates title, description, keywords)
    ↓
Upload to Adobe Stock
    ↓
Upload Success  →  Earnings Dashboard
```

---

## 3. Screens Built

| # | Screen | Description |
|---|--------|-------------|
| 1 | **Onboarding** | Adobe Mint logo, "Snap. Mint. Earn." hero, 3 feature highlights, Get Started + Adobe ID CTAs |
| 2 | **Camera Roll (Home)** | 3-column photo grid, multi-select with red checkmarks, animated "Mint Photos →" bar |
| 3 | **Swipe to Mint** | Tinder-style card swipe — right to mint, left to skip. MINT/SKIP stamps, progress bar, undo button, done state |
| 4 | **AI Tagging** | Photo preview, AI-generated title/description/keywords (editable), category badge, multi-photo strip |
| 5 | **Upload Success** | Confirmation screen, 3-step review timeline (Editor Review → Approval → Earning) |
| 6 | **Earnings Dashboard** | Total earnings hero, monthly bar chart, stats row (this month / downloads / approved), filterable submission list |
| 7 | **Profile** | User card, stats grid, Account + Preferences settings with toggles |

---

## 4. Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | React Native 0.76.3 |
| Toolchain | Expo SDK ~52.0.0 |
| Language | TypeScript |
| Navigation | React Navigation 6 (native-stack + bottom-tabs) |
| Camera Roll | expo-media-library |
| Storage | @react-native-async-storage/async-storage |
| Icons | @expo/vector-icons (Ionicons) |
| Gradients | expo-linear-gradient |

---

## 5. Project Structure

```
Adobe Mint/
├── App.tsx                        # Root — onboarding state, NavigationContainer
├── app.json                       # Expo config, permissions
├── package.json
├── tsconfig.json
│
├── src/
│   ├── theme/
│   │   └── index.ts               # Colors, typography, spacing, borderRadius
│   │
│   ├── types/
│   │   └── index.ts               # Photo, TaggedPhoto, Submission, nav param types
│   │
│   ├── navigation/
│   │   └── AppNavigator.tsx       # Root stack + bottom tab navigator
│   │
│   ├── screens/
│   │   ├── OnboardingScreen.tsx
│   │   ├── HomeScreen.tsx         # Camera roll grid + selection
│   │   ├── SwipeScreen.tsx        # Tinder-style swipe UI (PanResponder)
│   │   ├── TaggingScreen.tsx      # AI metadata review + edit
│   │   ├── UploadSuccessScreen.tsx
│   │   ├── EarningsScreen.tsx
│   │   └── ProfileScreen.tsx
│   │
│   ├── components/
│   │   ├── Button.tsx             # Primary / secondary / ghost variants
│   │   ├── TagChip.tsx            # Keyword chip with optional remove
│   │   ├── EarningsCard.tsx       # Stat card (accent + default)
│   │   └── SubmissionRow.tsx      # Submission list item with status badge
│   │
│   ├── mock/
│   │   └── data.ts                # Mock submissions, monthly earnings, stats
│   │
│   └── utils/
│       └── aiTagging.ts           # Mock AI tag generation (replace with real API)
│
└── preview/
    ├── index.html                 # All 6 screens in phone frames (browser preview)
    └── swipe.html                 # Interactive swipe experience (browser preview)
```

---

## 6. Design System

### Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#FA0F00` | Adobe Red — CTAs, selections, active states |
| `dark` | `#1D1D1D` | Primary text, hero card background |
| `midGray` | `#6E6E6E` | Secondary text, captions |
| `offWhite` | `#F5F5F5` | Screen backgrounds, cards |
| `success` | `#2D9D78` | Approved, mint action |
| `error` | `#E34850` | Rejected, skip action |
| `info` | `#1473E6` | Pending status, Adobe blue |
| `warning` | `#E68619` | In Review status |

### Typography
- Font: System default (SF Pro on iOS, Roboto on Android)
- Scale: 11 / 13 / 15 / 17 / 20 / 24 / 32 / 44px
- Weights: 400 / 500 / 600 / 700 / 800

---

## 7. Key Implementation Notes

### Camera Roll Access
`HomeScreen.tsx` uses `expo-media-library` to load photos in pages of 60, sorted by `creationTime`. Permissions are requested on mount with a custom permission UI if denied.

### Swipe to Mint (`SwipeScreen.tsx`)
Built with React Native's `PanResponder`. Cards tilt on drag (rotation factor: 12°). MINT/SKIP stamps fade in proportionally to drag distance. Swipe threshold: 32% of screen width. Supports undo (step back one card).

### AI Tagging (`aiTagging.ts`)
Currently **mocked** — generates deterministic tags from a seeded random function using the photo ID as seed. Simulates a 2.2s API call.

**To replace with real AI:** swap `generateAITags()` in `src/utils/aiTagging.ts` with a call to your vision/tagging API (e.g. Adobe Firefly, OpenAI Vision, or Google Vision API).

### Adobe Stock Upload
Currently **mocked** with a 2s delay in `TaggingScreen.tsx`. Wire up the [Adobe Stock API](https://developer.adobe.com/stock/docs/) — specifically the `POST /upload` and `POST /submit` endpoints with OAuth via Adobe IMS.

### Onboarding State
Persisted via `AsyncStorage` key `'onboarded'`. Set to `'true'` on first Get Started tap — skips onboarding on subsequent launches.

---

## 8. What's Mocked (Needs Real Integration)

| Feature | File | What to replace with |
|---------|------|---------------------|
| AI metadata generation | `src/utils/aiTagging.ts` | Vision API (Adobe Firefly / OpenAI Vision / Google Vision) |
| Adobe Stock upload | `TaggingScreen.tsx` `handleUpload()` | Adobe Stock Contributor API |
| Adobe ID sign-in | `OnboardingScreen.tsx` | Adobe IMS OAuth 2.0 |
| Earnings data | `src/mock/data.ts` | Adobe Stock Contributor earnings API |
| Push notifications | `ProfileScreen.tsx` toggle | expo-notifications + backend webhook |

---

## 9. Running the App

### Prerequisites
- Node.js 18+
- Expo Go app on iPhone ([App Store](https://apps.apple.com/app/expo-go/id982107779))
- Mac and iPhone on the **same WiFi** (or use phone as hotspot)

### Start
```bash
cd "Adobe Mint"
npm install          # first time only
npx expo start
```
Scan the QR code with your iPhone camera → opens in Expo Go.

### If on different networks
Turn on iPhone **Personal Hotspot** → connect Mac to it → run `npx expo start`.

---

## 10. Browser Previews

Two interactive HTML previews are in `/preview/` — no build needed, open in any browser:

| File | URL | What it shows |
|------|-----|---------------|
| `index.html` | `localhost:3456` | All 6 screens in phone frames, tab-switchable |
| `swipe.html` | `localhost:3456/swipe.html` | Fully interactive swipe-to-mint experience |

**To serve locally:**
```bash
cd "Adobe Mint"
npx expo start   # serves on :8081
# or run the preview server:
node -e "const h=require('http'),fs=require('fs'),p=require('path');h.createServer((req,res)=>{const f=p.join('./preview',req.url==='/'?'index.html':req.url.slice(1));try{res.writeHead(200,{'Content-Type':'text/html'});res.end(fs.readFileSync(f));}catch(e){res.writeHead(404);res.end();}}).listen(3456)"
```

---

## 11. Next Steps

### MVP (P0)
- [ ] Wire Adobe IMS OAuth for sign-in
- [ ] Connect Adobe Stock Contributor API for upload + submission status
- [ ] Replace mock AI tagging with real vision API
- [ ] Add expo-notifications for approval alerts

### Post-MVP (P1)
- [ ] Bulk upload queue with background processing
- [ ] Earnings payout flow (PayPal / bank transfer)
- [ ] Photo quality filter (blur detection, resolution check before submission)
- [ ] Referral / invite system for creator growth
- [ ] Localization: Hindi, Bahasa, Portuguese

### Growth (P2)
- [ ] "Trending keywords" surface — show what's selling on Adobe Stock
- [ ] Earnings leaderboard / community
- [ ] Android parity (app is cross-platform, needs testing)
- [ ] App Store + Google Play submission

---

## 12. Contacts & Resources

| Resource | Link |
|----------|------|
| Adobe Stock Contributor API | https://developer.adobe.com/stock/docs/ |
| Adobe IMS OAuth docs | https://developer.adobe.com/developer-console/ |
| Expo docs | https://docs.expo.dev |
| React Navigation | https://reactnavigation.org |

---

*Built with Claude Code · Adobe Mint v1.0 · May 2026*
