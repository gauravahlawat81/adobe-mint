import React, { useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  PanResponder,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../theme';
import type { TaggedPhoto } from '../types';

const { width, height } = Dimensions.get('window');
export const CARD_WIDTH  = width - spacing.lg * 2;
export const CARD_HEIGHT = height * 0.68;
const SWIPE_THRESHOLD   = 100;
const SWIPE_OUT_DURATION = 220;

interface Props {
  tagged: TaggedPhoto;
  isTop: boolean;
  stackIndex: number; // 0 = top, 1 = behind, 2 = further behind
  onSwipeLeft:  () => void;
  onSwipeRight: () => void;
}

export default function SwipeCard({ tagged, isTop, stackIndex, onSwipeLeft, onSwipeRight }: Props) {
  const position = useRef(new Animated.ValueXY()).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => isTop,
      onMoveShouldSetPanResponder: (_e, gs) =>
        isTop && Math.abs(gs.dx) > Math.abs(gs.dy) * 1.2,
      onPanResponderMove: (_e, gs) => {
        position.setValue({ x: gs.dx, y: gs.dy * 0.15 });
      },
      onPanResponderRelease: (_e, gs) => {
        if (gs.dx > SWIPE_THRESHOLD) {
          swipeOut('right');
        } else if (gs.dx < -SWIPE_THRESHOLD) {
          swipeOut('left');
        } else {
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
            friction: 5,
          }).start();
        }
      },
    })
  ).current;

  const swipeOut = (dir: 'left' | 'right') => {
    const x = dir === 'right' ? width + 100 : -(width + 100);
    Animated.timing(position, {
      toValue: { x, y: 0 },
      duration: SWIPE_OUT_DURATION,
      useNativeDriver: true,
    }).start(() => (dir === 'right' ? onSwipeRight() : onSwipeLeft()));
  };

  const rotate = position.x.interpolate({
    inputRange: [-width / 2, 0, width / 2],
    outputRange: ['-12deg', '0deg', '12deg'],
    extrapolate: 'clamp',
  });

  const acceptOpacity = position.x.interpolate({
    inputRange: [20, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const rejectOpacity = position.x.interpolate({
    inputRange: [-100, -20],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  // Background cards scale up as top card moves away
  const scaleBase = 1 - stackIndex * 0.04;
  const translateYBase = stackIndex * 14;

  if (!isTop) {
    return (
      <View
        style={[
          styles.card,
          {
            transform: [{ scale: scaleBase }, { translateY: translateYBase }],
            zIndex: 10 - stackIndex,
          },
        ]}
      >
        <Image source={{ uri: tagged.photo.uri }} style={styles.photo} resizeMode="cover" />
        <View style={styles.meta}>
          <Text style={styles.title} numberOfLines={1}>{tagged.title}</Text>
        </View>
      </View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.card,
        styles.topCard,
        { transform: [{ translateX: position.x }, { translateY: position.y }, { rotate }] },
      ]}
      {...panResponder.panHandlers}
    >
      {/* Photo */}
      <Image source={{ uri: tagged.photo.uri }} style={styles.photo} resizeMode="cover" />

      {/* Needs Review badge — shown permanently on flagged photos */}
      {tagged.requiresReview && (
        <View style={styles.reviewBadge}>
          <Ionicons name="alert-circle" size={13} color="#92400E" />
          <Text style={styles.reviewBadgeText}>Needs Review</Text>
        </View>
      )}

      {/* UPLOAD / SEND FOR REVIEW overlay */}
      <Animated.View style={[styles.overlay, styles.overlayRight, { opacity: acceptOpacity }]}>
        <View style={[styles.overlayBadge, tagged.requiresReview && styles.overlayBadgeAmber]}>
          <Ionicons name={tagged.requiresReview ? 'shield-checkmark' : 'checkmark'} size={28} color={colors.white} />
          <Text style={styles.overlayText}>{tagged.requiresReview ? 'SEND FOR REVIEW' : 'UPLOAD'}</Text>
        </View>
      </Animated.View>

      {/* SKIP overlay */}
      <Animated.View style={[styles.overlay, styles.overlayLeft, { opacity: rejectOpacity }]}>
        <View style={[styles.overlayBadge, styles.overlayBadgeRed]}>
          <Ionicons name="close" size={28} color={colors.white} />
          <Text style={styles.overlayText}>SKIP</Text>
        </View>
      </Animated.View>

      {/* Metadata scroll */}
      <ScrollView
        style={styles.metaScroll}
        contentContainerStyle={styles.metaContent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
      >
        {/* Category badge */}
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{tagged.category}</Text>
        </View>

        <Text style={styles.title}>{tagged.title}</Text>
        <Text style={styles.description}>{tagged.description}</Text>

        {/* Review notice */}
        {tagged.requiresReview && (
          <View style={styles.reviewNote}>
            <Ionicons name="alert-circle-outline" size={14} color="#F59E0B" />
            <Text style={styles.reviewNoteText}>
              Flagged for human review before publishing to Adobe Stock.{tagged.reviewReason ? ` Reason: ${tagged.reviewReason}` : ''}
            </Text>
          </View>
        )}

        {/* Keywords */}
        <View style={styles.keywords}>
          {tagged.keywords.slice(0, 10).map(kw => (
            <View key={kw} style={styles.kwChip}>
              <Text style={styles.kwText}>{kw}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  topCard: {
    zIndex: 20,
  },
  photo: {
    width: '100%',
    height: CARD_HEIGHT * 0.58,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    height: CARD_HEIGHT * 0.58,
    justifyContent: 'flex-start',
    paddingTop: spacing.xl,
  },
  overlayRight: {
    alignItems: 'flex-start',
    paddingLeft: spacing.xl,
  },
  overlayLeft: {
    alignItems: 'flex-end',
    paddingRight: spacing.xl,
  },
  overlayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#16A34A',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.white,
  },
  overlayBadgeRed: {
    backgroundColor: '#DC2626',
  },
  overlayBadgeAmber: {
    backgroundColor: '#D97706',
  },
  reviewBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#F59E0B',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    zIndex: 10,
  },
  reviewBadgeText: {
    fontSize: 11,
    fontFamily: typography.weights.semibold,
    color: '#92400E',
  },
  overlayText: {
    color: colors.white,
    fontFamily: typography.weights.heavy,
    fontSize: typography.sizes.md,
    letterSpacing: 1,
  },
  metaScroll: {
    flex: 1,
  },
  metaContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF0EF',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  categoryText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.weights.semibold,
    color: colors.primary,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontFamily: typography.weights.bold,
    color: colors.dark,
    lineHeight: 24,
  },
  description: {
    fontSize: typography.sizes.sm,
    color: colors.midGray,
    lineHeight: 20,
  },
  reviewNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#FFFBEB',
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  reviewNoteText: {
    fontSize: typography.sizes.xs,
    color: '#92400E',
    flex: 1,
  },
  keywords: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  kwChip: {
    backgroundColor: colors.offWhite,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  kwText: {
    fontSize: 11,
    color: colors.darkGray,
    fontFamily: typography.weights.medium,
  },
});
