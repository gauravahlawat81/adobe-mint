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
  const [signingIn, setSigningIn] = useState(false);
  const { height } = useWindowDimensions();
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== 'light';
  const theme = getTheme(isDark);
  const compact = height < 700;

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    try {
      const result = await WebBrowser.openAuthSessionAsync(
        `${BACKEND_URL}/auth/google`,
        'com.adobe.mint://auth'
      );

      // On Android, openAuthSessionAsync intercepts the deep link internally
      // and returns it in result.url — the Linking event does NOT fire.
      // We must handle the token here directly.
      if (result.type === 'success' && result.url) {
        await handleAuthUrl(result.url);
      } else {
        // cancel / dismiss / any other outcome → reset button
        setSigningIn(false);
      }
    } catch {
      Alert.alert('Sign-in failed', 'Could not connect. Please try again.');
      setSigningIn(false);
    }
  };

  const handleAuthUrl = async (url: string) => {
    try {
      const parsed = Linking.parse(url);
      const sessionToken = parsed.queryParams?.session as string | undefined;
      const error = parsed.queryParams?.error as string | undefined;

      if (error) {
        Alert.alert('Sign-in failed', `Google returned: ${error}`);
        setSigningIn(false);
        return;
      }

      if (!sessionToken) {
        Alert.alert('Sign-in failed', 'No session token received.');
        setSigningIn(false);
        return;
      }

      // Decode JWT payload (backend already verified it)
      const [, payloadB64] = sessionToken.split('.');
      const payload = JSON.parse(
        atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'))
      );

      await saveSession({
        token: sessionToken,
        id:    payload.sub,
        email: payload.email,
        name:  payload.name ?? payload.email,
      });
      await AsyncStorage.setItem('onboarded', 'true');

      navigation.replace('Main');
    } catch (e) {
      console.error('handleAuthUrl error:', e);
      Alert.alert('Sign-in failed', 'Could not complete sign-in. Please try again.');
      setSigningIn(false);
    }
  };

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
                  <Text style={[styles.logoMint, { color: theme.text }]}>Mint</Text>
                </View>
              </View>

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
                      <Text style={[styles.featureDesc, { color: theme.textMuted }]}>{f.description}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* ── Bottom block ── */}
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
          </View>
        </SafeAreaView>
      </LinearGradient>
    </>
  );
}

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
    top: '38%' as any,
    right: -60,
  },
  blob3: {
    width: 300,
    height: 180,
    bottom: '18%' as any,
    left: -40,
  },
  scroll: {
    flex: 1,
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

  // Hero
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

  // Features
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

  // ── Bottom ──
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
});
