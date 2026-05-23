import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as WebBrowser from 'expo-web-browser';
import { colors, typography, spacing, borderRadius } from '../theme';
import type { RootStackParamList } from '../types';
import { BACKEND_URL } from '../config';

WebBrowser.maybeCompleteAuthSession();

type Nav = NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;

type FeatureIcon = 'images-outline' | 'sparkles-outline' | 'trending-up-outline';
interface Feature { icon: FeatureIcon; title: string; description: string }

const FEATURES: Feature[] = [
  {
    icon: 'images-outline',
    title: 'Browse Your Camera Roll',
    description: 'AI scans your gallery and picks photos with real commercial value.',
  },
  {
    icon: 'sparkles-outline',
    title: 'AI Generates Metadata',
    description: 'Professional titles, descriptions and keywords — written instantly.',
  },
  {
    icon: 'trending-up-outline',
    title: 'Earn on Adobe Stock',
    description: 'Swipe right to publish to 1M+ buyers on Adobe Stock marketplace.',
  },
];

export default function OnboardingScreen() {
  const navigation = useNavigation<Nav>();
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const [signingIn, setSigningIn] = useState(false);
  const { height } = useWindowDimensions();

  // Compact layout on shorter devices (< 700dp)
  const compact = height < 700;

  React.useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    try {
      const result = await WebBrowser.openAuthSessionAsync(
        `${BACKEND_URL}/auth/google`,
        'com.adobe.mint://auth'
      );
      if (result.type === 'cancel') setSigningIn(false);
    } catch {
      Alert.alert('Sign-in failed', 'Could not connect. Please try again.');
      setSigningIn(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Animated.View style={[styles.animWrap, { opacity: fadeAnim }]}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          bounces={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Top block ── */}
          <View style={styles.top}>
            {/* Logo */}
            <View style={styles.logoRow}>
              <View style={styles.logoMark}>
                <Text style={styles.logoMarkText}>M</Text>
              </View>
              <View>
                <Text style={styles.logoAdobe}>ADOBE</Text>
                <Text style={styles.logoMint}>Mint</Text>
              </View>
            </View>

            {/* Hero */}
            <View style={[styles.hero, compact && styles.heroCompact]}>
              <Text style={[styles.heroTitle, compact && styles.heroTitleCompact]}>
                Snap.{'\n'}Mint.{'\n'}Earn.
              </Text>
              <Text style={styles.heroSub}>
                Turn your camera roll into a money-minting machine on Adobe Stock.
              </Text>
            </View>

            {/* Features */}
            <View style={styles.features}>
              {FEATURES.map(f => (
                <View key={f.title} style={styles.featureRow}>
                  <View style={styles.featureIcon}>
                    <Ionicons name={f.icon} size={20} color={colors.primary} />
                  </View>
                  <View style={styles.featureText}>
                    <Text style={styles.featureTitle}>{f.title}</Text>
                    <Text style={styles.featureDesc}>{f.description}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* ── Bottom block (CTAs) ── */}
          <View style={styles.bottom}>
            {/* Primary CTA */}
            <TouchableOpacity
              style={[styles.googleBtn, signingIn && styles.googleBtnDisabled]}
              onPress={handleGoogleSignIn}
              disabled={signingIn}
              activeOpacity={0.85}
            >
              <View style={styles.googleLogoBox}>
                <Text style={styles.googleLogoLetter}>G</Text>
              </View>
              <Text style={styles.googleBtnText}>
                {signingIn ? 'Opening Sign-In…' : 'Sign in with Google'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.securedText}>🔒 Secured by Google</Text>

            {/* Skip */}
            <TouchableOpacity
              style={styles.skipBtn}
              onPress={() => navigation.replace('Main')}
              activeOpacity={0.7}
            >
              <Text style={styles.skipText}>Continue without account</Text>
            </TouchableOpacity>

            <Text style={styles.legal}>
              By continuing, you agree to Adobe's Terms of Service and Privacy Policy.
            </Text>
          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.white,
  },
  animWrap: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    justifyContent: 'space-between',
  },

  // ── Top ──
  top: {
    gap: spacing.xl,
  },

  // Logo
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoMark: {
    width: 40,
    height: 40,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoMarkText: {
    color: colors.white,
    fontSize: typography.sizes.xl,
    fontFamily: typography.weights.heavy,
  },
  logoAdobe: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.weights.bold,
    color: colors.midGray,
    letterSpacing: 2,
  },
  logoMint: {
    fontSize: typography.sizes.xl,
    fontFamily: typography.weights.heavy,
    color: colors.dark,
    lineHeight: 24,
  },

  // Hero
  hero: {
    gap: spacing.sm,
  },
  heroCompact: {
    gap: spacing.xs,
  },
  heroTitle: {
    fontSize: 40,
    fontFamily: typography.weights.heavy,
    color: colors.dark,
    lineHeight: 46,
  },
  heroTitleCompact: {
    fontSize: 32,
    lineHeight: 38,
  },
  heroSub: {
    fontSize: typography.sizes.md,
    color: colors.midGray,
    lineHeight: 22,
  },

  // Features
  features: {
    gap: spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.offWhite,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: '#FFF0EF',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  featureText: {
    flex: 1,
    paddingTop: 2,
  },
  featureTitle: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.weights.semibold,
    color: colors.dark,
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: typography.sizes.xs,
    color: colors.midGray,
    lineHeight: 17,
  },

  // ── Bottom ──
  bottom: {
    marginTop: spacing.xl,
    gap: spacing.sm,
    alignItems: 'center',
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md + 2,
    alignSelf: 'stretch',
  },
  googleBtnDisabled: {
    opacity: 0.6,
  },
  googleLogoBox: {
    width: 22,
    height: 22,
    backgroundColor: colors.white,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleLogoLetter: {
    color: '#4285F4',
    fontSize: 13,
    fontFamily: typography.weights.heavy,
  },
  googleBtnText: {
    color: colors.white,
    fontSize: typography.sizes.md,
    fontFamily: typography.weights.bold,
  },
  securedText: {
    fontSize: typography.sizes.xs,
    color: colors.lightGray,
    textAlign: 'center',
  },
  skipBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  skipText: {
    fontSize: typography.sizes.sm,
    color: colors.midGray,
    fontFamily: typography.weights.regular,
    textDecorationLine: 'underline',
  },
  legal: {
    fontSize: typography.sizes.xs,
    color: colors.lightGray,
    textAlign: 'center',
    lineHeight: 17,
    paddingHorizontal: spacing.md,
  },
});
