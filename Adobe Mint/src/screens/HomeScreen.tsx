import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, typography, spacing, borderRadius } from '../theme';
import { postSubmission, getSubmissionHashes } from '../utils/api';
import { scanningService } from '../services/ScanningService';
import SwipeCard, { CARD_WIDTH } from '../components/SwipeCard';
import type { TaggedPhoto } from '../types';

const { width } = Dimensions.get('window');
const TUTORIAL_KEY = 'swipe_tutorial_shown';
const SCAN_LIMIT   = 200;

type Phase = 'permission' | 'scanning' | 'swiping' | 'done';

export default function HomeScreen() {
  const [phase, setPhase]               = useState<Phase>(() => {
    // Restore phase if scan is already running (e.g. user switched tabs and came back)
    const s = scanningService.getState();
    if (s.status === 'running')  return s.cards.length > 0 ? 'swiping' : 'scanning';
    if (s.status === 'complete') return s.cards.length > 0 ? 'swiping' : 'permission';
    return 'permission';
  });
  const [cards, setCards]               = useState<TaggedPhoto[]>(() => scanningService.getState().cards);
  const [index, setIndex]               = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);
  const [progress, setProgress]         = useState(() => scanningService.getState().progress);
  const [scanDone, setScanDone]         = useState(() => scanningService.getState().status === 'complete');
  const [accepted, setAccepted]         = useState(0);
  const [skipped, setSkipped]           = useState(0);

  const tutorialOpacity    = useRef(new Animated.Value(0)).current;
  const tutorialHandX      = useRef(new Animated.Value(0)).current;
  const tutorialArrowLeft  = useRef(new Animated.Value(0)).current;
  const tutorialArrowRight = useRef(new Animated.Value(0)).current;
  const scanPulse          = useRef(new Animated.Value(1)).current;

  // Scanning pulse
  useEffect(() => {
    if (phase !== 'scanning') return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(scanPulse, { toValue: 1.12, duration: 700, useNativeDriver: true }),
        Animated.timing(scanPulse, { toValue: 1,    duration: 700, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [phase]);

  const startTutorialAnim = useCallback(() => {
    tutorialOpacity.setValue(0);
    tutorialHandX.setValue(0);
    Animated.sequence([
      Animated.timing(tutorialOpacity,    { toValue: 1,  duration: 300, useNativeDriver: true }),
      Animated.delay(500),
      Animated.parallel([
        Animated.timing(tutorialHandX,      { toValue: 80,  duration: 500, useNativeDriver: true }),
        Animated.timing(tutorialArrowRight, { toValue: 1,   duration: 300, useNativeDriver: true }),
      ]),
      Animated.delay(300),
      Animated.parallel([
        Animated.timing(tutorialHandX,      { toValue: 0,  duration: 400, useNativeDriver: true }),
        Animated.timing(tutorialArrowRight, { toValue: 0,  duration: 200, useNativeDriver: true }),
      ]),
      Animated.delay(400),
      Animated.parallel([
        Animated.timing(tutorialHandX,     { toValue: -80, duration: 500, useNativeDriver: true }),
        Animated.timing(tutorialArrowLeft, { toValue: 1,   duration: 300, useNativeDriver: true }),
      ]),
      Animated.delay(300),
      Animated.parallel([
        Animated.timing(tutorialHandX,     { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(tutorialArrowLeft, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const dismissTutorial = useCallback(async () => {
    Animated.timing(tutorialOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() =>
      setShowTutorial(false)
    );
    await AsyncStorage.setItem(TUTORIAL_KEY, 'true');
  }, []);

  // ── Subscribe to ScanningService events ───────────────────────────────────
  useEffect(() => {
    const unsubFound = scanningService.on<TaggedPhoto>('photo_found', photo => {
      setCards(prev => {
        // Transition to swiping on the very first photo found
        if (prev.length === 0) {
          setPhase('swiping');
          AsyncStorage.getItem(TUTORIAL_KEY).then(shown => {
            if (!shown) { setShowTutorial(true); setTimeout(startTutorialAnim, 300); }
          });
        }
        return [...prev, photo];
      });
    });

    const unsubProgress = scanningService.on('progress', (p) => {
      setProgress(p);
    });

    const unsubComplete = scanningService.on('complete', () => {
      setScanDone(true);
      // If nothing was found at all, go to done screen
      setCards(prev => {
        if (prev.length === 0) setPhase('done');
        return prev;
      });
    });

    const unsubReset = scanningService.on('reset', () => {
      setCards([]);
      setIndex(0);
      setProgress({ scanned: 0, total: 0, found: 0, errors: 0 });
      setScanDone(false);
      setPhase('permission');
    });

    return () => {
      unsubFound();
      unsubProgress();
      unsubComplete();
      unsubReset();
    };
  }, [startTutorialAnim]);

  const requestPermission = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Adobe Mint needs camera roll access to find stock-worthy photos.',
        [{ text: 'Try Again', onPress: requestPermission }]
      );
      return;
    }
    startScanning();
  };

  const startScanning = async () => {
    scanningService.reset();
    setPhase('scanning');

    const { assets } = await MediaLibrary.getAssetsAsync({
      mediaType: 'photo',
      first: SCAN_LIMIT,
      sortBy: [MediaLibrary.SortBy.modificationTime],
    });

    if (assets.length === 0) { setPhase('done'); return; }

    const fullAssets = await Promise.all(assets.map(a => MediaLibrary.getAssetInfoAsync(a)));
    const photos = fullAssets
      .filter(a => a.localUri || a.uri)
      .map(a => ({ ...a, uri: a.localUri ?? a.uri }));

    // Fetch hashes of already-uploaded photos so they're skipped during the scan.
    // Best-effort: if it fails (e.g. guest/offline), we just scan everything.
    let knownHashes = new Set<string>();
    try {
      knownHashes = new Set(await getSubmissionHashes());
    } catch {
      // ignore — proceed without dedup
    }

    // Fire-and-forget — results stream in via events above
    scanningService.start(photos as any, knownHashes);
  };

  const handleSwipeRight = useCallback(async (tagged: TaggedPhoto) => {
    setAccepted(a => a + 1);
    setIndex(i => i + 1);
    if (showTutorial) dismissTutorial();

    // Fire-and-forget — don't block the UI
    postSubmission({
      title:           tagged.title,
      description:     tagged.description,
      keywords:        tagged.keywords,
      category:        tagged.category,
      thumbnail_uri:   tagged.photo.uri,
      requires_review: tagged.requiresReview,
      review_reason:   tagged.reviewReason ?? null,
      photo_hash:      tagged.photoHash ?? null,
    }).catch(() => {
      // Silent fail — submissions are best-effort (backend also rejects dupes via unique index)
    });
  }, [showTutorial, dismissTutorial]);

  const handleSwipeLeft = useCallback((_tagged: TaggedPhoto) => {
    setSkipped(s => s + 1);
    setIndex(i => i + 1);
    if (showTutorial) dismissTutorial();
  }, [showTutorial, dismissTutorial]);

  // User edited a card's metadata before swiping — update state (and the service so it
  // survives tab switches). The submit handler reads the latest card, so edits are sent.
  const handleEditCard = useCallback((updated: TaggedPhoto) => {
    setCards(prev => prev.map(c => (c.photo.id === updated.photo.id ? updated : c)));
    scanningService.updateCard(updated);
  }, []);

  useEffect(() => {
    // Only go to done when scan is also finished — there may be more cards coming
    if (phase === 'swiping' && scanDone && index >= cards.length && cards.length > 0) {
      setPhase('done');
    }
  }, [index, cards.length, phase, scanDone]);

  // ── Permission ─────────────────────────────────────────────────────────────
  if (phase === 'permission') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <View style={styles.permIcon}>
            <Ionicons name="images-outline" size={48} color={colors.primary} />
          </View>
          <Text style={styles.permTitle}>Find Your Best Photos</Text>
          <Text style={styles.permDesc}>
            Adobe Mint uses AI to scan your camera roll and identify photos
            that are commercially valuable on Adobe Stock.
          </Text>
          <View style={styles.bullets}>
            {[
              { icon: 'sparkles-outline' as const,      text: 'AI picks stock-worthy shots' },
              { icon: 'pricetag-outline' as const,      text: 'Auto-generates titles & keywords' },
              { icon: 'trending-up-outline' as const,   text: 'Swipe right to publish' },
            ].map(b => (
              <View key={b.text} style={styles.bullet}>
                <View style={styles.bulletIcon}>
                  <Ionicons name={b.icon} size={18} color={colors.primary} />
                </View>
                <Text style={styles.bulletText}>{b.text}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity style={styles.primaryBtn} onPress={requestPermission}>
            <Text style={styles.primaryBtnText}>Allow Camera Roll Access</Text>
          </TouchableOpacity>
          <Text style={styles.legal}>Photos stay on device. Only metadata is sent to Adobe Stock.</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Scanning ───────────────────────────────────────────────────────────────
  if (phase === 'scanning') {
    const pct = progress.total > 0 ? Math.round((progress.scanned / progress.total) * 100) : 0;
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Animated.View style={[styles.scanOrb, { transform: [{ scale: scanPulse }] }]}>
            <Ionicons name="sparkles" size={40} color={colors.white} />
          </Animated.View>
          <Text style={styles.scanTitle}>Scanning your camera roll</Text>
          <Text style={styles.scanSub}>
            {progress.total > 0
              ? `Analysed ${progress.scanned} of ${progress.total} · ${progress.found} stock-worthy found`
              : 'Loading photos…'}
          </Text>
          {progress.errors > 0 && (
            <Text style={styles.scanError}>
              ⚠️ {progress.errors} photo{progress.errors !== 1 ? 's' : ''} failed AI analysis (retrying…)
            </Text>
          )}
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${pct}%` }]} />
          </View>
          <Text style={styles.progressPct}>{pct}%</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Done ───────────────────────────────────────────────────────────────────
  if (phase === 'done') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <View style={styles.doneIcon}>
            <Ionicons name="checkmark-circle" size={72} color={colors.success} />
          </View>
          <Text style={styles.doneTitle}>All done!</Text>
          <Text style={styles.doneSub}>
            {accepted > 0
              ? `${accepted} photo${accepted !== 1 ? 's' : ''} submitted to Adobe Stock.`
              : 'No photos selected this time.'}
            {'\n'}Skipped {skipped}. Check Earnings for status updates.
          </Text>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => { setAccepted(0); setSkipped(0); setIndex(0); setScanDone(false); startScanning(); }}
          >
            <Ionicons name="refresh-outline" size={18} color={colors.white} />
            <Text style={styles.primaryBtnText}>Scan Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Swipe ──────────────────────────────────────────────────────────────────
  const remaining = cards.length - index;

  return (
    <SafeAreaView style={styles.container}>
      {/* Scanning-in-progress pill — visible while scan is still running */}
      {!scanDone && (
        <View style={styles.scanningPill}>
          <Ionicons name="sparkles" size={12} color={colors.primary} />
          <Text style={styles.scanningPillText}>
            Scanning… {progress.scanned}/{progress.total} · {progress.found} found
          </Text>
        </View>
      )}
      <View style={styles.swipeHeader}>
        <View>
          <Text style={styles.swipeLabel}>CAMERA ROLL</Text>
          <Text style={styles.swipeCount}>{remaining} left to review</Text>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statChip}>
            <Ionicons name="checkmark" size={13} color={colors.success} />
            <Text style={[styles.statText, { color: colors.success }]}>{accepted}</Text>
          </View>
          <View style={styles.statChip}>
            <Ionicons name="close" size={13} color={colors.error} />
            <Text style={[styles.statText, { color: colors.error }]}>{skipped}</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardStack}>
        {[2, 1, 0].map(offset => {
          const ci = index + offset;
          if (ci >= cards.length) return null;
          return (
            <SwipeCard
              key={cards[ci].photo.id}
              tagged={cards[ci]}
              isTop={offset === 0}
              stackIndex={offset}
              onSwipeRight={() => handleSwipeRight(cards[ci])}
              onSwipeLeft={() => handleSwipeLeft(cards[ci])}
              onEdit={handleEditCard}
            />
          );
        })}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, { borderColor: colors.error }]}
          onPress={() => handleSwipeLeft(cards[index])}
        >
          <Ionicons name="close" size={30} color={colors.error} />
        </TouchableOpacity>
        <Text style={styles.actionHint}>swipe or tap</Text>
        <TouchableOpacity
          style={[styles.actionBtn, { borderColor: colors.success }]}
          onPress={() => handleSwipeRight(cards[index])}
        >
          <Ionicons name="checkmark" size={30} color={colors.success} />
        </TouchableOpacity>
      </View>

      {/* Tutorial overlay */}
      {showTutorial && (
        <Animated.View style={[styles.tutorial, { opacity: tutorialOpacity }]}>
          <View style={styles.tutorialLabels}>
            <Animated.View style={[styles.tutorialLabel, { backgroundColor: '#DC2626', opacity: tutorialArrowLeft }]}>
              <Ionicons name="arrow-back" size={16} color="#fff" />
              <Text style={styles.tutorialLabelText}>Skip</Text>
            </Animated.View>
            <Animated.View style={[styles.tutorialLabel, { backgroundColor: '#16A34A', opacity: tutorialArrowRight }]}>
              <Text style={styles.tutorialLabelText}>Upload</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </Animated.View>
          </View>

          <Animated.Text style={[styles.tutorialHand, { transform: [{ translateX: tutorialHandX }] }]}>
            👆
          </Animated.Text>

          <View style={styles.tutorialCard}>
            <Text style={styles.tutorialTitle}>How to review photos</Text>
            {[
              { color: '#16A34A', icon: 'checkmark' as const, text: 'Swipe right to upload to Adobe Stock' },
              { color: '#DC2626', icon: 'close'     as const, text: 'Swipe left to skip' },
              { color: colors.midGray, icon: 'hand-left-outline' as const, text: 'Scroll card to read full metadata' },
            ].map(row => (
              <View key={row.text} style={styles.tutorialRow}>
                <View style={[styles.tutorialBadge, { backgroundColor: row.color }]}>
                  <Ionicons name={row.icon} size={16} color="#fff" />
                </View>
                <Text style={styles.tutorialRowText}>{row.text}</Text>
              </View>
            ))}
            <TouchableOpacity style={styles.tutorialBtn} onPress={dismissTutorial}>
              <Text style={styles.tutorialBtnText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.offWhite },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl, gap: spacing.lg },

  // Permission
  permIcon:    { width: 96, height: 96, borderRadius: 48, backgroundColor: '#FFF0EF', alignItems: 'center', justifyContent: 'center' },
  permTitle:   { fontSize: typography.sizes.xxl, fontFamily: typography.weights.bold, color: colors.dark, textAlign: 'center' },
  permDesc:    { fontSize: typography.sizes.md, color: colors.midGray, textAlign: 'center', lineHeight: 24 },
  bullets:     { alignSelf: 'stretch', gap: spacing.md },
  bullet:      { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  bulletIcon:  { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFF0EF', alignItems: 'center', justifyContent: 'center' },
  bulletText:  { fontSize: typography.sizes.md, color: colors.dark, fontFamily: typography.weights.medium, flex: 1 },
  primaryBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.primary, borderRadius: borderRadius.lg, paddingVertical: spacing.md + 2, alignSelf: 'stretch' },
  primaryBtnText: { color: colors.white, fontFamily: typography.weights.bold, fontSize: typography.sizes.md },
  legal:       { fontSize: typography.sizes.xs, color: colors.lightGray, textAlign: 'center' },

  // Scanning
  scanOrb:      { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  scanTitle:    { fontSize: typography.sizes.xl, fontFamily: typography.weights.bold, color: colors.dark, textAlign: 'center' },
  scanSub:      { fontSize: typography.sizes.sm, color: colors.midGray, textAlign: 'center', lineHeight: 22 },
  progressTrack:{ width: '80%', height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden', marginTop: spacing.md },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 3 },
  progressPct:  { fontSize: typography.sizes.sm, color: colors.midGray, fontFamily: typography.weights.semibold },
  scanError:    { fontSize: typography.sizes.xs, color: '#B45309', textAlign: 'center', marginTop: spacing.xs },
  scanningPill: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'center', backgroundColor: '#FFF0EF', borderRadius: borderRadius.full, paddingHorizontal: spacing.md, paddingVertical: 5, marginBottom: spacing.xs },
  scanningPillText: { fontSize: typography.sizes.xs, color: colors.primary, fontFamily: typography.weights.medium },

  // Done
  doneIcon:  { marginBottom: spacing.md },
  doneTitle: { fontSize: typography.sizes.xxl, fontFamily: typography.weights.bold, color: colors.dark },
  doneSub:   { fontSize: typography.sizes.md, color: colors.midGray, textAlign: 'center', lineHeight: 24 },

  // Swipe
  swipeHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md },
  swipeLabel:  { fontSize: typography.sizes.xs, fontFamily: typography.weights.bold, color: colors.midGray, letterSpacing: 1.2 },
  swipeCount:  { fontSize: typography.sizes.lg, fontFamily: typography.weights.bold, color: colors.dark },
  statsRow:    { flexDirection: 'row', gap: spacing.sm },
  statChip:    { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.white, borderRadius: borderRadius.full, paddingHorizontal: spacing.sm, paddingVertical: 4, borderWidth: 1, borderColor: colors.border },
  statText:    { fontSize: typography.sizes.sm, fontFamily: typography.weights.bold },
  cardStack:   { flex: 1, alignItems: 'center', justifyContent: 'center' },
  actions:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.lg, gap: spacing.xl },
  actionBtn:   { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4, borderWidth: 2 },
  actionHint:  { fontSize: typography.sizes.xs, color: colors.lightGray, fontFamily: typography.weights.medium },

  // Tutorial
  tutorial:          { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.78)', alignItems: 'center', justifyContent: 'center', gap: spacing.xl, zIndex: 100 },
  tutorialLabels:    { flexDirection: 'row', justifyContent: 'space-between', width: CARD_WIDTH },
  tutorialLabel:     { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full },
  tutorialLabelText: { color: '#fff', fontFamily: typography.weights.bold, fontSize: typography.sizes.sm },
  tutorialHand:      { fontSize: 48, marginBottom: -spacing.xl },
  tutorialCard:      { backgroundColor: colors.white, borderRadius: borderRadius.xl, padding: spacing.xl, width: CARD_WIDTH, gap: spacing.md },
  tutorialTitle:     { fontSize: typography.sizes.lg, fontFamily: typography.weights.bold, color: colors.dark, marginBottom: spacing.sm },
  tutorialRow:       { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  tutorialBadge:     { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  tutorialRowText:   { fontSize: typography.sizes.md, color: colors.dark, flex: 1 },
  tutorialBtn:       { backgroundColor: colors.dark, borderRadius: borderRadius.lg, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.sm },
  tutorialBtnText:   { color: '#fff', fontFamily: typography.weights.bold, fontSize: typography.sizes.md },
});
