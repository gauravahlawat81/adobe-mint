import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../theme';

interface TagChipProps {
  label: string;
  onRemove?: () => void;
  variant?: 'default' | 'primary';
}

export default function TagChip({ label, onRemove, variant = 'default' }: TagChipProps) {
  return (
    <View style={[styles.chip, variant === 'primary' && styles.chipPrimary]}>
      <Text style={[styles.label, variant === 'primary' && styles.labelPrimary]} numberOfLines={1}>
        {label}
      </Text>
      {onRemove && (
        <TouchableOpacity onPress={onRemove} hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}>
          <Ionicons
            name="close-circle"
            size={16}
            color={variant === 'primary' ? colors.white : colors.midGray}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.offWhite,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  label: {
    fontSize: typography.sizes.sm,
    color: colors.darkGray,
    fontFamily: typography.weights.medium,
  },
  labelPrimary: {
    color: colors.white,
  },
});
