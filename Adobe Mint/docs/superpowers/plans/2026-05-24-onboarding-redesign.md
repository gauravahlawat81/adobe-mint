# Onboarding Screen Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign `OnboardingScreen.tsx` with automatic dark/light theme support, ambient background blobs, glassmorphism-style feature cards, SVG icons, and a proper Google sign-in button — no animations.

**Architecture:** Single-file rewrite of `OnboardingScreen.tsx`. Theme tokens live in a `getTheme(isDark: boolean)` helper defined at the top of the file. Background is a `LinearGradient` with three absolute-positioned ambient blob `View`s. All `Animated` imports and `useRef`/`useEffect` animation code removed. Google logo loaded from `assets/google-logo.png`.

**Tech Stack:** React Native 0.76, Expo 52, `expo-linear-gradient` (already installed), `@expo/vector-icons` Ionicons (already installed), `useColorScheme` from react-native (built-in).

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/screens/OnboardingScreen.tsx` | Rewrite | Full redesigned screen |
| `assets/google-logo.png` | Already present | Google logo asset |

---

### Task 1: Add theme token helper and swap background

**Files:**
- Modify: `src/screens/OnboardingScreen.tsx`

- [ ] **Step 1: Remove all animation imports and state**

Open `src/screens/OnboardingScreen.tsx`. Replace the import block and remove `Animated`, `useRef`, and the `useEffect` animation call. Add `useColorScheme` and `ImageBackground`. The new imports should be:

```typescript
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  useWindowDimensions,
  useColorScheme,
  Image,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { typography, spacing, borderRadius } from '../theme';
import type { RootStackParamList } from '../types';
import { BACKEND_URL } from '../config';
import { saveSession } from '../utils/session';
```

- [ ] **Step 2: Add `getTheme` helper after imports**

Add this directly after the imports, before `WebBrowser.maybeCompleteAuthSession()`:

```typescript
WebBrowser.maybeCompleteAuthSession();

function getTheme(isDark: boolean) {
  return {
    bg:           isDark ? (['#080810', '#0c0c18'] as const) : (['#FAFAFA', '#F2F2F7'] as const),
    surface:      isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
    surfaceBorder:isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
    text:         isDark ? '#FFFFFF'                : '#1A1A1A',
    textMuted:    isDark ? 'rgba(255,255,255,0.45)' : '#888888',
    textFaint:    isDark ? 'rgba(255,255,255,0.2)'  : '#CCCCCC',
    logoAdobe:    isDark ? 'rgba(255,255,255,0.38)' : '#ABABAB',
    skipText:     isDark ? 'rgba(255,255,255,0.35)' : '#ABABAB',
    securedText:  isDark ? 'rgba(255,255,255,0.3)'  : '#BBBBBB',
    blob1:        isDark ? 'rgba(250,15,0,0.10)'    : 'rgba(250,15,0,0.07)',
    blob2:        isDark ? 'rgba(255,80,20,0.07)'   : 'rgba(250,15,0,0.05)',
    blob3:        isDark ? 'rgba(180,10,0,0.05)'    : 'rgba(250,15,0,0.04)',
    googleShadow: isDark ? 0.4                      : 0.12,
    googleBorder: isDark ? 'transparent'            : 'rgba(0,0,0,0.09)',
  };
}
```

- [ ] **Step 3: Update `OnboardingScreen` to use `useColorScheme` and remove animation state**

Replace the function signature and state block:

```typescript
export default function OnboardingScreen() {
  const navigation = useNavigation<Nav>();
  const [signingIn, setSigningIn] = useState(false);
  const { height } = useWindowDimensions();
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== 'light';
  const theme = getTheme(isDark);
  const compact = height < 700;

  // handleGoogleSignIn and handleAuthUrl remain unchanged
```

- [ ] **Step 4: Wrap the return in a `LinearGradient` background with ambient blobs**

Replace the outer `<SafeAreaView>` and its content wrapper with:

```tsx
return (
  <>
    <StatusBar
      barStyle={isDark ? 'light-content' : 'dark-content'}
      backgroundColor="transparent"
      translucent
    />
    <LinearGradient
      colors={theme.bg}
      style={styles.flex}
    >
      {/* Ambient blobs */}
      <View style={[styles.blob, styles.blob1, { backgroundColor: theme.blob1 }]} />
      <View style={[styles.blob, styles.blob2, { backgroundColor: theme.blob2 }]} />
      <View style={[styles.blob, styles.blob3, { backgroundColor: theme.blob3 }]} />

      <SafeAreaView style={styles.flex}>
        {/* rest of content goes here in Task 2 */}
      </SafeAreaView>
    </LinearGradient>
  </>
);
```

- [ ] **Step 5: Add blob styles to `StyleSheet.create`**

Replace the old `safe` and `animWrap` styles. Add at the top of the styles object:

```typescript
const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
  },
  blob1: {
    width: 280,
    height: 280,
    top: -80,
    left: -80,
  },
  blob2: {
    width: 220,
    height: 220,
    top: '38%',
    right: -60,
  },
  blob3: {
    width: 300,
    height: 180,
    bottom: '18%',
    left: -40,
  },
  // ... rest of styles follow in later tasks
```

- [ ] **Step 6: Verify the app runs with the new background**

```bash
cd "/Users/gaahlawat/Desktop/Adobe Mint/Adobe Mint" && npx expo start --android
```

Expected: App opens, dark/light gradient background visible, no crash.

- [ ] **Step 7: Commit**

```bash
cd "/Users/gaahlawat/Desktop/Adobe Mint/Adobe Mint"
git add src/screens/OnboardingScreen.tsx
git commit -m "feat: onboarding — theme tokens, LinearGradient bg, ambient blobs"
```

---

### Task 2: Logo section

**Files:**
- Modify: `src/screens/OnboardingScreen.tsx`

- [ ] **Step 1: Replace the logo JSX**

Inside the `<SafeAreaView>`, add a `<View style={styles.scroll}>` wrapper (replacing the old `<ScrollView>`). Inside it, render:

```tsx
<SafeAreaView style={styles.flex}>
  <View style={styles.scroll}>
    {/* ── Top block ── */}
    <View style={styles.top}>

      {/* Logo */}
      <View style={styles.logoRow}>
        <View style={styles.logoMark}>
          <Text style={styles.logoMarkText}>M</Text>
        </View>
        <View>
          <Text style={[styles.logoAdobe, { color: theme.logoAdobe }]}>ADOBE</Text>
          <Text style={[styles.logoMint,  { color: theme.text }]}>Mint</Text>
        </View>
      </View>

    </View>
    {/* ── Bottom block ── */}
    <View style={styles.bottom}>
    </View>
  </View>
</SafeAreaView>
```

- [ ] **Step 2: Add logo styles**

```typescript
  scroll: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    justifyContent: 'space-between',
  },
  top: {
    gap: spacing.xl,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoMark: {
    width: 40,
    height: 40,
    backgroundColor: '#FA0F00',
    borderRadius: borderRadius.sm + 4,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FA0F00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  logoMarkText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.xl,
    fontFamily: typography.weights.heavy,
  },
  logoAdobe: {
    fontSize: typography.sizes.xs - 2,
    fontFamily: typography.weights.bold,
    letterSpacing: 2,
  },
  logoMint: {
    fontSize: typography.sizes.xl,
    fontFamily: typography.weights.heavy,
    lineHeight: 24,
  },
```

- [ ] **Step 3: Commit**

```bash
git add src/screens/OnboardingScreen.tsx
git commit -m "feat: onboarding — themed logo section"
```

---

### Task 3: Hero section

**Files:**
- Modify: `src/screens/OnboardingScreen.tsx`

- [ ] **Step 1: Add hero JSX inside `<View style={styles.top}>`**

After the logo block:

```tsx
{/* Hero */}
<View style={[styles.hero, compact && styles.heroCompact]}>
  <Text style={styles.eyebrow}>Your photos, monetized</Text>
  <Text style={[styles.heroTitle, compact && styles.heroTitleCompact]}>
    {'Snap.\nMint.\nEarn.'}
  </Text>
  <Text style={[styles.heroSub, { color: theme.textMuted }]}>
    Turn your camera roll into a money-minting machine on Adobe Stock.
  </Text>
</View>
```

- [ ] **Step 2: Add hero styles**

```typescript
  hero: {
    gap: spacing.sm,
  },
  heroCompact: {
    gap: spacing.xs,
  },
  eyebrow: {
    fontSize: 10,
    fontFamily: typography.weights.bold,
    color: '#FA0F00',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 40,
    fontFamily: typography.weights.heavy,
    color: '#FA0F00',
    lineHeight: 46,
  },
  heroTitleCompact: {
    fontSize: 32,
    lineHeight: 38,
  },
  heroSub: {
    fontSize: typography.sizes.md,
    lineHeight: 22,
  },
```

- [ ] **Step 3: Commit**

```bash
git add src/screens/OnboardingScreen.tsx
git commit -m "feat: onboarding — hero section with eyebrow and themed text"
```

---

### Task 4: Feature cards with SVG icons

**Files:**
- Modify: `src/screens/OnboardingScreen.tsx`

- [ ] **Step 1: Update the FEATURES constant — replace icon names with Ionicons names**

```typescript
type FeatureIcon = 'images-outline' | 'layers-outline' | 'trending-up-outline';
interface Feature { icon: FeatureIcon; title: string; description: string }

const FEATURES: Feature[] = [
  {
    icon: 'images-outline',
    title: 'Browse Your Camera Roll',
    description: 'AI scans your gallery and picks photos with real commercial value.',
  },
  {
    icon: 'layers-outline',
    title: 'AI Generates Metadata',
    description: 'Professional titles, descriptions and keywords — written instantly.',
  },
  {
    icon: 'trending-up-outline',
    title: 'Earn on Adobe Stock',
    description: 'Swipe right to publish to 1M+ buyers on Adobe Stock marketplace.',
  },
];
```

- [ ] **Step 2: Add feature cards JSX inside `<View style={styles.top}>`**

After the hero block:

```tsx
{/* Features */}
<View style={styles.features}>
  {FEATURES.map(f => (
    <View
      key={f.title}
      style={[
        styles.featureRow,
        {
          backgroundColor: theme.surface,
          borderColor: theme.surfaceBorder,
        },
      ]}
    >
      <View style={styles.featureIcon}>
        <Ionicons name={f.icon} size={18} color="#FA0F00" />
      </View>
      <View style={styles.featureText}>
        <Text style={[styles.featureTitle, { color: theme.text }]}>{f.title}</Text>
        <Text style={[styles.featureDesc,  { color: theme.textMuted }]}>{f.description}</Text>
      </View>
    </View>
  ))}
</View>
```

- [ ] **Step 3: Add feature card styles**

```typescript
  features: {
    gap: spacing.sm,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(250,15,0,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(250,15,0,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.weights.semibold,
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: typography.sizes.xs,
    lineHeight: 17,
  },
```

- [ ] **Step 4: Commit**

```bash
git add src/screens/OnboardingScreen.tsx
git commit -m "feat: onboarding — glassmorphism feature cards with Ionicons"
```

---

### Task 5: CTA section — Google button and secondary actions

**Files:**
- Modify: `src/screens/OnboardingScreen.tsx`

- [ ] **Step 1: Add Google button JSX inside `<View style={styles.bottom}>`**

```tsx
<View style={styles.bottom}>
  {/* Google Sign-In */}
  <TouchableOpacity
    style={[
      styles.googleBtn,
      signingIn && styles.googleBtnDisabled,
      {
        shadowOpacity: theme.googleShadow,
        borderColor: theme.googleBorder,
      },
    ]}
    onPress={handleGoogleSignIn}
    disabled={signingIn}
    activeOpacity={0.85}
  >
    <Image
      source={require('../../assets/google-logo.png')}
      style={styles.googleLogo}
      resizeMode="contain"
    />
    <Text style={styles.googleBtnText}>
      {signingIn ? 'Opening Sign-In…' : 'Sign in with Google'}
    </Text>
  </TouchableOpacity>

  {/* Secured */}
  <View style={styles.securedRow}>
    <Ionicons name="lock-closed-outline" size={11} color={theme.securedText} />
    <Text style={[styles.securedText, { color: theme.securedText }]}>Secured by Google</Text>
  </View>

  {/* Skip */}
  <TouchableOpacity
    style={styles.skipBtn}
    onPress={() => navigation.replace('Main')}
    activeOpacity={0.7}
  >
    <Text style={[styles.skipText, { color: theme.skipText }]}>Continue without account</Text>
  </TouchableOpacity>

  <Text style={[styles.legal, { color: theme.textFaint }]}>
    By continuing, you agree to Adobe's Terms of Service and Privacy Policy.
  </Text>
</View>
```

- [ ] **Step 2: Add CTA styles**

```typescript
  bottom: {
    gap: spacing.sm,
    alignItems: 'center',
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md + 2,
    alignSelf: 'stretch',
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
  },
  googleBtnDisabled: {
    opacity: 0.6,
  },
  googleLogo: {
    width: 20,
    height: 20,
  },
  googleBtnText: {
    color: '#1D1D1D',
    fontSize: typography.sizes.md,
    fontFamily: typography.weights.bold,
  },
  securedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  securedText: {
    fontSize: typography.sizes.xs,
    textAlign: 'center',
  },
  skipBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  skipText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.weights.regular,
    textDecorationLine: 'underline',
  },
  legal: {
    fontSize: typography.sizes.xs,
    textAlign: 'center',
    lineHeight: 17,
    paddingHorizontal: spacing.md,
  },
```

- [ ] **Step 3: Commit**

```bash
git add src/screens/OnboardingScreen.tsx
git commit -m "feat: onboarding — Google button with real logo, themed secondary actions"
```

---

### Task 6: Clean up — remove all remaining animation code

**Files:**
- Modify: `src/screens/OnboardingScreen.tsx`

- [ ] **Step 1: Verify no `Animated`, `useRef`, or `useEffect` references remain**

```bash
grep -n "Animated\|useRef\|useEffect\|fadeAnim" \
  "/Users/gaahlawat/Desktop/Adobe Mint/Adobe Mint/src/screens/OnboardingScreen.tsx"
```

Expected: no output. If any lines print, remove them.

- [ ] **Step 2: Verify no `ScrollView` reference remains**

The old `<ScrollView>` has been replaced by a plain `<View style={styles.scroll}>`. Check:

```bash
grep -n "ScrollView" \
  "/Users/gaahlawat/Desktop/Adobe Mint/Adobe Mint/src/screens/OnboardingScreen.tsx"
```

Expected: no output.

- [ ] **Step 3: Verify no `colors` import from theme (no longer needed — colors are inline)**

```bash
grep -n "^import.*colors" \
  "/Users/gaahlawat/Desktop/Adobe Mint/Adobe Mint/src/screens/OnboardingScreen.tsx"
```

If present, remove `colors` from the theme import line since all color values now come from `getTheme()`.

- [ ] **Step 4: Full smoke test — run on device/simulator**

```bash
cd "/Users/gaahlawat/Desktop/Adobe Mint/Adobe Mint" && npx expo start
```

Check:
- Dark mode device → dark `#080810` background, white text, translucent cards
- Light mode device → `#FAFAFA` background, dark text, white cards  
- Google button is white with real Google logo in both themes
- No crashes, no TypeScript errors in the terminal

- [ ] **Step 5: Final commit**

```bash
cd "/Users/gaahlawat/Desktop/Adobe Mint/Adobe Mint"
git add src/screens/OnboardingScreen.tsx
git commit -m "feat: onboarding — complete redesign, dark/light theme, remove all animations"
```
