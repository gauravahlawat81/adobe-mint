# OnboardingScreen Redesign — Design Spec
**Date:** 2026-05-24  
**Status:** Approved  
**Style system:** UI/UX Pro Max · Modern Dark Cinema Mobile

---

## Goal

Redesign the Adobe Mint OnboardingScreen (sign-in screen) with a modern dark/light theme, ambient background depth, and polished static layout. No entrance animations — content is immediately visible and still.

---

## Design Decisions

### Theme
- Automatically follows the device system setting (`useColorScheme`)
- **Dark:** `#080810` deep navy-black background
- **Light:** `#FAFAFA` warm off-white background

### Ambient Background
Three static soft blobs (absolute-positioned Views, `borderRadius: 999`, low opacity) give depth without motion:

| Blob | Dark opacity | Light opacity | Position |
|------|-------------|---------------|----------|
| 1 (large warm red) | 0.10 | 0.07 | top-left |
| 2 (mid orange-red) | 0.07 | 0.05 | mid-right |
| 3 (deep red)       | 0.05 | 0.04 | bottom-left |

Implemented as plain Views with a background color — no animation, no blur library required.

### Grid Overlay
Subtle 28pt repeating grid using a pattern of thin lines:
- Dark: `rgba(255,255,255,0.02)`
- Light: `rgba(0,0,0,0.025)`

### Logo
- Existing `M` logomark in `#FA0F00` on a `borderRadius: 10` square
- Shadow: `shadowColor: #FA0F00`, `shadowOpacity: 0.2`, `shadowRadius: 8`
- ADOBE label: dark `rgba(255,255,255,0.38)` / light `#ABABAB`
- Mint label: dark `#FFFFFF` / light `#1A1A1A`

### Eyebrow
- New line above hero: `"Your photos, monetized"`
- `fontSize: 10`, `letterSpacing: 2`, `color: #FA0F00`, uppercase

### Hero Text
- "Snap.\nMint.\nEarn." — solid `#FA0F00` (no gradient, avoids MaskedView dependency)
- `fontSize: 34`, `fontFamily: AdobeClean-ExtraBold`

### Feature Cards
- **Dark:** `backgroundColor: rgba(255,255,255,0.04)`, `borderColor: rgba(255,255,255,0.07)`, `borderWidth: 1`
- **Light:** `backgroundColor: #FFFFFF`, `borderColor: rgba(0,0,0,0.07)`, `borderWidth: 1`, soft shadow
- Icons: `@expo/vector-icons` Ionicons SVG — no emoji
  - Camera Roll → `images-outline`
  - AI Metadata → `layers-outline`
  - Earn → `trending-up-outline`
- Icon container: `#FA0F00` at 12% opacity background / 20% border

### Google Sign-In Button
- `backgroundColor: #FFFFFF` in both themes
- Real Google logo from `assets/google-logo.png` via `<Image>`
- Button text: `"Sign in with Google"`, `color: #1D1D1D`, `fontWeight: 600`
- Dark shadow: `shadowOpacity: 0.4` / Light: `shadowOpacity: 0.12` + `borderColor: rgba(0,0,0,0.09)`

### Secondary Actions
- "🔒 Secured by Google" → remove emoji, use `Ionicons lock-closed-outline` inline
- "Continue without account" — underline, dark `rgba(255,255,255,0.35)` / light `#ABABAB`
- Legal text — dark `rgba(255,255,255,0.2)` / light `#CCCCCC`

---

## No Animation
All entrance animations removed. No `Animated.timing`, no staggered delays, no looping effects. Content renders fully visible immediately.

---

## Files Changed
- `src/screens/OnboardingScreen.tsx` — full rewrite of styles + structure
- `assets/google-logo.png` — already in place

## Dependencies
All required packages already installed:
- `expo-linear-gradient` — used for background LinearGradient
- `@expo/vector-icons` — Ionicons for feature icons
- `react-native` `useColorScheme` — theme detection (built-in)
