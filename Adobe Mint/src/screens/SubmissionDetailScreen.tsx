import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, typography, spacing, borderRadius } from '../theme';
import type { RootStackParamList, SubmissionStatus } from '../types';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width - spacing.lg * 2;
const CARD_HEIGHT = height * 0.72;

const statusConfig: Record<SubmissionStatus, { label: string; color: string; bg: string }> = {
  submitted: { label: 'Uploaded',  color: '#1D4ED8', bg: '#EBF3FE' },
  reviewing: { label: 'In Review', color: '#B45309', bg: '#FDF3E4' },
  approved:  { label: 'Approved',  color: '#047857', bg: '#E8F8F3' },
  rejected:  { label: 'Rejected',  color: '#B91C1C', bg: '#FEECEC' },
};

type Nav = NativeStackNavigationProp<RootStackParamList, 'SubmissionDetail'>;
type Route = RouteProp<RootStackParamList, 'SubmissionDetail'>;

export default function SubmissionDetailScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const s = params.submission;
  const status = statusConfig[s.status];
  const date = new Date(s.submittedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={colors.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Submission</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          {/* Photo */}
          <Image source={{ uri: s.thumbnailUri }} style={styles.photo} resizeMode="cover" />

          {/* Status badge (top-right) */}
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Text style={[styles.statusBadgeText, { color: status.color }]}>{status.label}</Text>
          </View>

          {/* Needs Review pill if applicable */}
          {s.requiresReview && (
            <View style={styles.reviewBadge}>
              <Ionicons name="alert-circle" size={13} color="#92400E" />
              <Text style={styles.reviewBadgeText}>Needs Review</Text>
            </View>
          )}

          {/* Metadata */}
          <View style={styles.meta}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{s.category}</Text>
            </View>

            <Text style={styles.title}>{s.title}</Text>
            {s.description ? <Text style={styles.description}>{s.description}</Text> : null}

            <View style={styles.divider} />

            {/* Upload info */}
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={14} color={colors.midGray} />
              <Text style={styles.infoText}>Uploaded {date}</Text>
            </View>

            {s.status === 'approved' && (
              <>
                <View style={styles.infoRow}>
                  <Ionicons name="cash-outline" size={14} color={colors.success} />
                  <Text style={[styles.infoText, { color: colors.success }]}>
                    ${s.earnings.toFixed(2)} earned
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="download-outline" size={14} color={colors.midGray} />
                  <Text style={styles.infoText}>{s.downloads} downloads</Text>
                </View>
              </>
            )}

            {s.requiresReview && s.reviewReason ? (
              <View style={styles.reviewNote}>
                <Ionicons name="alert-circle-outline" size={14} color="#F59E0B" />
                <Text style={styles.reviewNoteText}>{s.reviewReason}</Text>
              </View>
            ) : null}

            {/* Keywords */}
            {s.keywords.length > 0 && (
              <>
                <View style={styles.divider} />
                <Text style={styles.sectionLabel}>Keywords</Text>
                <View style={styles.keywords}>
                  {s.keywords.map(kw => (
                    <View key={kw} style={styles.kwChip}>
                      <Text style={styles.kwText}>{kw}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeBtn: {
    width: 32, height: 32, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    fontSize: typography.sizes.md,
    fontFamily: typography.weights.semibold,
    color: colors.dark,
  },
  scroll: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  photo: {
    width: '100%',
    height: CARD_HEIGHT * 0.55,
    backgroundColor: colors.offWhite,
  },
  statusBadge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  statusBadgeText: {
    fontSize: 11,
    fontFamily: typography.weights.semibold,
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
  },
  reviewBadgeText: {
    fontSize: 11,
    fontFamily: typography.weights.semibold,
    color: '#92400E',
  },
  meta: {
    padding: spacing.lg,
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
    lineHeight: 26,
  },
  description: {
    fontSize: typography.sizes.sm,
    color: colors.midGray,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  sectionLabel: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.weights.semibold,
    color: colors.midGray,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  infoText: {
    fontSize: typography.sizes.sm,
    color: colors.darkGray,
  },
  reviewNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#FFFBEB',
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginTop: spacing.xs,
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
