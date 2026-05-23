import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../theme';
import EarningsCard from '../components/EarningsCard';
import SubmissionRow from '../components/SubmissionRow';
import { getSubmissions, getStats, type Submission, type Stats } from '../utils/api';
import type { SubmissionStatus } from '../types';

const { width } = Dimensions.get('window');
const CHART_HEIGHT = 100;

const STATUS_FILTERS: Array<{ key: SubmissionStatus | 'all'; label: string }> = [
  { key: 'all',       label: 'All' },
  { key: 'approved',  label: 'Approved' },
  { key: 'reviewing', label: 'In Review' },
  { key: 'pending',   label: 'Pending' },
  { key: 'rejected',  label: 'Rejected' },
];

export default function EarningsScreen() {
  const [filter, setFilter] = useState<SubmissionStatus | 'all'>('all');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [subs, st] = await Promise.all([getSubmissions(), getStats()]);
      setSubmissions(subs);
      setStats(st);
    } catch {
      // guest user — no session token, keep empty state
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = filter === 'all'
    ? submissions
    : submissions.filter(s => s.status === filter);

  const monthly = stats?.monthly ?? [];
  const maxAmount = monthly.length > 0 ? Math.max(...monthly.map(m => m.amount), 1) : 1;

  const thisMonth  = monthly[monthly.length - 1];
  const lastMonth  = monthly[monthly.length - 2];
  const growthPct  = thisMonth && lastMonth && lastMonth.amount > 0
    ? Math.round(((thisMonth.amount - lastMonth.amount) / lastMonth.amount) * 100)
    : 0;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Earnings</Text>
          <TouchableOpacity style={styles.payoutBtn}>
            <Ionicons name="wallet-outline" size={18} color={colors.primary} />
            <Text style={styles.payoutText}>Payout</Text>
          </TouchableOpacity>
        </View>

        {/* Total Earnings Hero */}
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>TOTAL EARNED</Text>
          <Text style={styles.heroAmount}>${(stats?.totalEarnings ?? 0).toFixed(2)}</Text>
          {thisMonth && lastMonth ? (
            <View style={styles.growthRow}>
              <Ionicons
                name={growthPct >= 0 ? 'trending-up' : 'trending-down'}
                size={16}
                color={growthPct >= 0 ? colors.success : colors.error}
              />
              <Text style={[styles.growthText, { color: growthPct >= 0 ? colors.success : colors.error }]}>
                {growthPct >= 0 ? '+' : ''}{growthPct}% vs last month
              </Text>
            </View>
          ) : (
            <Text style={styles.growthText}>Submit photos to start earning</Text>
          )}
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <EarningsCard
            label="This Month"
            value={`$${(thisMonth?.amount ?? 0).toFixed(2)}`}
            subLabel={thisMonth?.month ?? '—'}
            accent
          />
          <View style={{ width: spacing.sm }} />
          <EarningsCard
            label="Downloads"
            value={String(stats?.totalDownloads ?? 0)}
            subLabel="All time"
          />
          <View style={{ width: spacing.sm }} />
          <EarningsCard
            label="Approved"
            value={String(stats?.approvedCount ?? 0)}
            subLabel={`of ${stats?.totalCount ?? 0} submitted`}
          />
        </View>

        {/* Monthly Chart */}
        {monthly.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Monthly Earnings</Text>
            <View style={styles.chartContainer}>
              {monthly.map((item, index) => {
                const barHeight = (item.amount / maxAmount) * CHART_HEIGHT;
                const isLast = index === monthly.length - 1;
                return (
                  <View key={item.year_month} style={styles.barGroup}>
                    <View style={styles.barTrack}>
                      <View style={[styles.bar, { height: barHeight }, isLast && styles.barActive]} />
                    </View>
                    <Text style={[styles.barLabel, isLast && styles.barLabelActive]}>{item.month}</Text>
                    {isLast && <Text style={styles.barAmount}>${item.amount.toFixed(0)}</Text>}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Submissions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Submissions</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {STATUS_FILTERS.map(f => (
              <TouchableOpacity
                key={f.key}
                onPress={() => setFilter(f.key)}
                style={[styles.filterTab, filter === f.key && styles.filterTabActive]}
              >
                <Text style={[styles.filterLabel, filter === f.key && styles.filterLabelActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.submissionList}>
            {filtered.length === 0 ? (
              <Text style={styles.emptyText}>
                {submissions.length === 0 ? 'No submissions yet. Upload some photos!' : 'No submissions in this category.'}
              </Text>
            ) : (
              filtered.map(s => (
                <SubmissionRow
                  key={s.id}
                  submission={{
                    id:           s.id,
                    thumbnailUri: s.thumbnail_uri ?? `https://picsum.photos/seed/${s.id}/200/200`,
                    title:        s.title,
                    keywords:     s.keywords,
                    category:     s.category as any,
                    status:       s.status,
                    submittedAt:  new Date(s.submittedAt),
                    reviewedAt:   s.reviewedAt ? new Date(s.reviewedAt) : undefined,
                    earnings:     s.earnings,
                    downloads:    s.downloads,
                  }}
                />
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: colors.white },
  scroll:      { paddingBottom: spacing.xxxl },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm,
  },
  headerTitle: { fontSize: typography.sizes.xxl, fontFamily: typography.weights.bold, color: colors.dark },
  payoutBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    borderWidth: 1.5, borderColor: colors.primary,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full,
  },
  payoutText:  { fontSize: typography.sizes.sm, fontFamily: typography.weights.semibold, color: colors.primary },
  heroCard: {
    marginHorizontal: spacing.lg, marginTop: spacing.md, marginBottom: spacing.lg,
    backgroundColor: colors.dark, borderRadius: borderRadius.xl, padding: spacing.xl, alignItems: 'center',
  },
  heroLabel:  { fontSize: typography.sizes.xs, color: 'rgba(255,255,255,0.5)', fontFamily: typography.weights.semibold, letterSpacing: 1.5, marginBottom: spacing.sm },
  heroAmount: { fontSize: typography.sizes.hero, fontFamily: typography.weights.heavy, color: colors.white, marginBottom: spacing.sm },
  growthRow:  { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  growthText: { fontSize: typography.sizes.sm, fontFamily: typography.weights.medium, color: 'rgba(255,255,255,0.6)' },
  statsRow:   { flexDirection: 'row', paddingHorizontal: spacing.lg, marginBottom: spacing.xl },
  section:    { paddingHorizontal: spacing.lg, marginBottom: spacing.xl },
  sectionTitle: { fontSize: typography.sizes.lg, fontFamily: typography.weights.bold, color: colors.dark, marginBottom: spacing.lg },
  chartContainer: {
    flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm,
    height: CHART_HEIGHT + 40, paddingBottom: 24, position: 'relative',
  },
  barGroup:       { flex: 1, alignItems: 'center', position: 'relative' },
  barTrack:       { width: '100%', height: CHART_HEIGHT, justifyContent: 'flex-end' },
  bar:            { width: '100%', backgroundColor: colors.border, borderRadius: borderRadius.sm },
  barActive:      { backgroundColor: colors.primary },
  barLabel:       { fontSize: typography.sizes.xs, color: colors.midGray, marginTop: spacing.xs },
  barLabelActive: { color: colors.primary, fontFamily: typography.weights.semibold },
  barAmount:      { fontSize: typography.sizes.xs, color: colors.primary, fontFamily: typography.weights.bold, marginTop: 2 },
  filterRow:      { gap: spacing.sm, marginBottom: spacing.lg, paddingRight: spacing.lg },
  filterTab: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: borderRadius.full, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white,
  },
  filterTabActive:  { backgroundColor: colors.dark, borderColor: colors.dark },
  filterLabel:      { fontSize: typography.sizes.sm, fontFamily: typography.weights.medium, color: colors.midGray },
  filterLabelActive:{ color: colors.white, fontFamily: typography.weights.semibold },
  submissionList:   { gap: 0 },
  emptyText:        { fontSize: typography.sizes.md, color: colors.midGray, textAlign: 'center', paddingVertical: spacing.xl },
});
