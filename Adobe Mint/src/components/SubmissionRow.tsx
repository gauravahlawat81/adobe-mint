import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme';
import type { Submission, SubmissionStatus } from '../types';

const statusConfig: Record<SubmissionStatus, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: colors.statusPending, bg: '#EBF3FE' },
  reviewing: { label: 'In Review', color: colors.statusReviewing, bg: '#FDF3E4' },
  approved: { label: 'Approved', color: colors.statusApproved, bg: '#E8F8F3' },
  rejected: { label: 'Rejected', color: colors.statusRejected, bg: '#FEECEC' },
};

interface SubmissionRowProps {
  submission: Submission;
}

export default function SubmissionRow({ submission }: SubmissionRowProps) {
  const status = statusConfig[submission.status];
  const dateStr = submission.submittedAt.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <View style={styles.row}>
      <Image source={{ uri: submission.thumbnailUri }} style={styles.thumbnail} />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{submission.title}</Text>
        <Text style={styles.meta}>
          {submission.category} · {dateStr}
        </Text>
        {submission.status === 'approved' && submission.earnings != null && (
          <Text style={styles.earnings}>
            ${submission.earnings.toFixed(2)} · {submission.downloads} downloads
          </Text>
        )}
      </View>
      <View style={[styles.badge, { backgroundColor: status.bg }]}>
        <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  thumbnail: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.offWhite,
  },
  info: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: typography.sizes.md,
    fontFamily: typography.weights.medium,
    color: colors.dark,
  },
  meta: {
    fontSize: typography.sizes.xs,
    color: colors.midGray,
  },
  earnings: {
    fontSize: typography.sizes.xs,
    color: colors.success,
    fontFamily: typography.weights.medium,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  badgeText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.weights.semibold,
  },
});
