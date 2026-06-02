import React, { useRef } from 'react';
import { Animated, PanResponder, StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../theme';
import SubmissionRow from './SubmissionRow';
import type { Submission } from '../types';

const DELETE_THRESHOLD = 110;

interface Props {
  submission: Submission;
  onPress: () => void;
  onRequestDelete: () => void; // parent shows confirmation + performs delete
}

// Wraps SubmissionRow: swipe the row right past a threshold to request deletion.
// Taps still pass through to onPress (the pan only claims horizontal gestures).
export default function SwipeableSubmissionRow({ submission, onPress, onRequestDelete }: Props) {
  const translateX = useRef(new Animated.Value(0)).current;

  const springBack = () => {
    Animated.spring(translateX, { toValue: 0, useNativeDriver: true, friction: 6 }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, gs) =>
        gs.dx > 8 && Math.abs(gs.dx) > Math.abs(gs.dy) * 1.5,
      onPanResponderMove: (_e, gs) => {
        if (gs.dx > 0) translateX.setValue(Math.min(gs.dx, DELETE_THRESHOLD + 40));
      },
      onPanResponderRelease: (_e, gs) => {
        if (gs.dx > DELETE_THRESHOLD) {
          springBack();          // reset position; parent shows confirm dialog
          onRequestDelete();
        } else {
          springBack();
        }
      },
      onPanResponderTerminate: springBack,
    })
  ).current;

  const iconOpacity = translateX.interpolate({
    inputRange: [0, DELETE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.wrap}>
      {/* Delete affordance revealed underneath as the row slides right */}
      <Animated.View style={[styles.deleteLayer, { opacity: iconOpacity }]}>
        <Ionicons name="trash" size={20} color={colors.white} />
        <Text style={styles.deleteText}>Delete</Text>
      </Animated.View>

      <Animated.View style={{ transform: [{ translateX }] }} {...panResponder.panHandlers}>
        <View style={styles.rowBg}>
          <SubmissionRow submission={submission} onPress={onPress} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative' },
  deleteLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.error,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: spacing.lg,
    gap: spacing.xs,
  },
  deleteText: { color: colors.white, fontFamily: typography.weights.bold, fontSize: typography.sizes.sm },
  rowBg: { backgroundColor: colors.white },
});
