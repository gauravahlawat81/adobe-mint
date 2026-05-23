import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
  PanResponder,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, typography, spacing, borderRadius } from '../theme';
import type { Photo, RootStackParamList } from '../types';

const { width: W, height: H } = Dimensions.get('window');
const CARD_W = W - spacing.xl * 2;
const CARD_H = H * 0.56;
const SWIPE_THRESHOLD = W * 0.32;
const ROTATION_FACTOR = 12;

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface SwipeCard {
  photo: Photo;
  label: string;
  category: string;
  keywords: string[];
}

interface SwipeScreenProps {
  cards: SwipeCard[];
  onDone: (minted: Photo[], skipped: Photo[]) => void;
}

function Card({
  card,
  isTop,
  onSwipeLeft,
  onSwipeRight,
}: {
  card: SwipeCard;
  isTop: boolean;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}) {
  const position = useRef(new Animated.ValueXY()).current;
  const mintOpacity = useRef(new Animated.Value(0)).current;
  const skipOpacity = useRef(new Animated.Value(0)).current;

  const rotate = position.x.interpolate({
    inputRange: [-W / 2, 0, W / 2],
    outputRange: [`-${ROTATION_FACTOR}deg`, '0deg', `${ROTATION_FACTOR}deg`],
    extrapolate: 'clamp',
  });

  const cardStyle = {
    transform: [
      { translateX: position.x },
      { translateY: position.y },
      { rotate },
    ],
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => isTop,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
        const progress = Math.abs(gesture.dx) / SWIPE_THRESHOLD;
        if (gesture.dx > 0) {
          mintOpacity.setValue(Math.min(progress, 1));
          skipOpacity.setValue(0);
        } else {
          skipOpacity.setValue(Math.min(progress, 1));
          mintOpacity.setValue(0);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          swipeOut('right');
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          swipeOut('left');
        } else {
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
            friction: 5,
          }).start();
          mintOpacity.setValue(0);
          skipOpacity.setValue(0);
        }
      },
    })
  ).current;

  const swipeOut = (dir: 'left' | 'right') => {
    const x = dir === 'right' ? W * 1.5 : -W * 1.5;
    Animated.timing(position, {
      toValue: { x, y: 0 },
      duration: 280,
      useNativeDriver: true,
    }).start(() => {
      if (dir === 'right') onSwipeRight();
      else onSwipeLeft();
    });
  };

  return (
    <Animated.View
      style={[styles.card, isTop && cardStyle]}
      {...(isTop ? panResponder.panHandlers : {})}
    >
      <Image source={{ uri: card.photo.uri }} style={styles.cardImage} />

      {/* Gradient overlay */}
      <View style={styles.cardGradient}>
        <View style={styles.cardMeta}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{card.category}</Text>
          </View>
          <Text style={styles.cardTitle} numberOfLines={2}>{card.label}</Text>
          <View style={styles.keywordsRow}>
            {card.keywords.slice(0, 4).map(kw => (
              <View key={kw} style={styles.kwChip}>
                <Text style={styles.kwText}>{kw}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* MINT stamp */}
      <Animated.View style={[styles.stamp, styles.mintStamp, { opacity: mintOpacity }]}>
        <Text style={[styles.stampText, { color: '#2D9D78' }]}>MINT</Text>
      </Animated.View>

      {/* SKIP stamp */}
      <Animated.View style={[styles.stamp, styles.skipStamp, { opacity: skipOpacity }]}>
        <Text style={[styles.stampText, { color: '#E34850' }]}>SKIP</Text>
      </Animated.View>
    </Animated.View>
  );
}

export default function SwipeScreen({ cards, onDone }: SwipeScreenProps) {
  const navigation = useNavigation<Nav>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [minted, setMinted] = useState<Photo[]>([]);
  const [skipped, setSkipped] = useState<Photo[]>([]);

  const handleSwipeLeft = useCallback(() => {
    setSkipped(prev => [...prev, cards[currentIndex].photo]);
    setCurrentIndex(i => {
      if (i + 1 >= cards.length) {
        onDone(minted, [...skipped, cards[i].photo]);
      }
      return i + 1;
    });
  }, [currentIndex, cards, minted, skipped, onDone]);

  const handleSwipeRight = useCallback(() => {
    setMinted(prev => [...prev, cards[currentIndex].photo]);
    setCurrentIndex(i => {
      if (i + 1 >= cards.length) {
        onDone([...minted, cards[i].photo], skipped);
      }
      return i + 1;
    });
  }, [currentIndex, cards, minted, skipped, onDone]);

  const remaining = cards.length - currentIndex;

  if (currentIndex >= cards.length) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.doneContainer}>
          <Text style={styles.doneEmoji}>🎉</Text>
          <Text style={styles.doneTitle}>All done!</Text>
          <Text style={styles.doneSub}>
            {minted.length} photo{minted.length !== 1 ? 's' : ''} queued for Adobe Stock
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={colors.dark} />
        </TouchableOpacity>
        <View style={styles.progressWrap}>
          {cards.map((_, i) => (
            <View
              key={i}
              style={[
                styles.progressDot,
                i < currentIndex && styles.progressDotMinted,
                i === currentIndex && styles.progressDotActive,
              ]}
            />
          ))}
        </View>
        <Text style={styles.progressCount}>{remaining} left</Text>
      </View>

      {/* Hint */}
      <View style={styles.hintRow}>
        <View style={styles.hintLeft}>
          <Ionicons name="close-circle" size={18} color={colors.error} />
          <Text style={styles.hintText}>Skip</Text>
        </View>
        <View style={styles.hintRight}>
          <Text style={styles.hintText}>Mint</Text>
          <Ionicons name="checkmark-circle" size={18} color={colors.success} />
        </View>
      </View>

      {/* Card Stack */}
      <View style={styles.cardStack}>
        {/* Render up to 3 cards in reverse so top card is on top */}
        {[2, 1, 0].map(offset => {
          const index = currentIndex + offset;
          if (index >= cards.length) return null;
          const isTop = offset === 0;
          return (
            <View
              key={cards[index].photo.id}
              style={[
                styles.cardContainer,
                !isTop && {
                  transform: [
                    { scale: 1 - offset * 0.04 },
                    { translateY: offset * 10 },
                  ],
                },
              ]}
            >
              <Card
                card={cards[index]}
                isTop={isTop}
                onSwipeLeft={handleSwipeLeft}
                onSwipeRight={handleSwipeRight}
              />
            </View>
          );
        })}
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.actionBtn, styles.skipBtn]} onPress={handleSwipeLeft}>
          <Ionicons name="close" size={30} color={colors.error} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.undoBtn}>
          <Ionicons name="arrow-undo" size={20} color={colors.midGray} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionBtn, styles.mintBtn]} onPress={handleSwipeRight}>
          <Ionicons name="checkmark" size={30} color={colors.success} />
        </TouchableOpacity>
      </View>

      {/* Bottom counts */}
      <View style={styles.bottomCounts}>
        <Text style={[styles.countText, { color: colors.error }]}>
          {skipped.length} skipped
        </Text>
        <Text style={[styles.countText, { color: colors.success }]}>
          {minted.length} to mint
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  progressWrap: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'center',
  },
  progressDot: {
    height: 4,
    flex: 1,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  progressDotActive: {
    backgroundColor: colors.dark,
  },
  progressDotMinted: {
    backgroundColor: colors.success,
  },
  progressCount: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.weights.semibold,
    color: colors.midGray,
    width: 40,
    textAlign: 'right',
  },
  hintRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xxl,
    marginBottom: spacing.sm,
  },
  hintLeft: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  hintRight: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  hintText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.weights.semibold,
    color: colors.midGray,
  },
  cardStack: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContainer: {
    position: 'absolute',
  },
  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    backgroundColor: colors.dark,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 10,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  cardGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '55%',
    justifyContent: 'flex-end',
    padding: spacing.lg,
    // Simulated gradient
    backgroundColor: 'transparent',
    background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
  },
  cardMeta: {
    gap: spacing.sm,
  },
  categoryBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  categoryText: {
    fontSize: typography.sizes.xs,
    color: colors.white,
    fontFamily: typography.weights.semibold,
  },
  cardTitle: {
    fontSize: typography.sizes.xl,
    fontFamily: typography.weights.bold,
    color: colors.white,
    lineHeight: 26,
  },
  keywordsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  kwChip: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  kwText: {
    fontSize: typography.sizes.xs,
    color: 'rgba(255,255,255,0.85)',
  },
  stamp: {
    position: 'absolute',
    top: 40,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 3,
  },
  mintStamp: {
    right: 20,
    borderColor: '#2D9D78',
    transform: [{ rotate: '12deg' }],
  },
  skipStamp: {
    left: 20,
    borderColor: '#E34850',
    transform: [{ rotate: '-12deg' }],
  },
  stampText: {
    fontSize: 28,
    fontFamily: typography.weights.heavy,
    letterSpacing: 2,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xl,
    paddingVertical: spacing.lg,
  },
  actionBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  skipBtn: {
    borderWidth: 2,
    borderColor: '#FEECEC',
  },
  mintBtn: {
    borderWidth: 2,
    borderColor: '#E8F8F3',
  },
  undoBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  bottomCounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xxxl,
    paddingBottom: spacing.lg,
  },
  countText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.weights.semibold,
  },
  doneContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  doneEmoji: { fontSize: 64 },
  doneTitle: {
    fontSize: typography.sizes.xxxl,
    fontFamily: typography.weights.heavy,
    color: colors.dark,
  },
  doneSub: {
    fontSize: typography.sizes.md,
    color: colors.midGray,
  },
});
