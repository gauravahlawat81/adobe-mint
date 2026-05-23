import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme';

interface EarningsCardProps {
  label: string;
  value: string;
  subLabel?: string;
  accent?: boolean;
}

export default function EarningsCard({ label, value, subLabel, accent = false }: EarningsCardProps) {
  return (
    <View style={[styles.card, accent && styles.cardAccent]}>
      <Text style={[styles.label, accent && styles.labelAccent]}>{label}</Text>
      <Text style={[styles.value, accent && styles.valueAccent]}>{value}</Text>
      {subLabel && (
        <Text style={[styles.subLabel, accent && styles.subLabelAccent]}>{subLabel}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.offWhite,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardAccent: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  label: {
    fontSize: typography.sizes.xs,
    color: colors.midGray,
    fontFamily: typography.weights.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  labelAccent: {
    color: 'rgba(255,255,255,0.75)',
  },
  value: {
    fontSize: typography.sizes.xxl,
    color: colors.dark,
    fontFamily: typography.weights.bold,
  },
  valueAccent: {
    color: colors.white,
  },
  subLabel: {
    fontSize: typography.sizes.xs,
    color: colors.midGray,
    marginTop: 2,
  },
  subLabelAccent: {
    color: 'rgba(255,255,255,0.7)',
  },
});
