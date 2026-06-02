import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, typography, spacing, borderRadius } from '../theme';
import { EditableText, KeywordsEditor, CategoryPicker } from '../components/EditableField';
import { updateSubmission, deleteSubmission } from '../utils/api';
import type { RootStackParamList, SubmissionStatus, StockCategory } from '../types';

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

  // Local editable state (optimistic)
  const [title, setTitle]             = useState(s.title);
  const [description, setDescription] = useState(s.description ?? '');
  const [keywords, setKeywords]       = useState<string[]>(s.keywords);
  const [category, setCategory]       = useState<StockCategory>(s.category as StockCategory);
  const [saving, setSaving]           = useState(false);
  const [deleting, setDeleting]       = useState(false);

  const status = statusConfig[s.status];
  const date = new Date(s.submittedAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  // Persist an edit. Optimistically updates local state, reverts the field on failure.
  const persist = async (next: { title?: string; description?: string; keywords?: string[]; category?: StockCategory }) => {
    const payload = {
      title:       next.title       ?? title,
      description: next.description ?? description,
      keywords:    next.keywords    ?? keywords,
      category:    next.category    ?? category,
    };
    setSaving(true);
    try {
      await updateSubmission(s.id, payload);
    } catch {
      Alert.alert('Could not save', 'Your change was not saved. Please try again.');
      // Revert
      setTitle(s.title);
      setDescription(s.description ?? '');
      setKeywords(s.keywords);
      setCategory(s.category as StockCategory);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      'Delete photo?',
      'This permanently removes the photo and its listing from Adobe Stock. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteSubmission(s.id);
              navigation.goBack();
            } catch {
              setDeleting(false);
              Alert.alert('Could not delete', 'Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={colors.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Submission</Text>
        <View style={styles.savingSlot}>
          {saving && <ActivityIndicator size="small" color={colors.primary} />}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          {/* Photo */}
          <Image source={{ uri: s.thumbnailUri }} style={styles.photo} resizeMode="cover" />

          {/* Status badge */}
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Text style={[styles.statusBadgeText, { color: status.color }]}>{status.label}</Text>
          </View>

          {s.requiresReview && (
            <View style={styles.reviewBadge}>
              <Ionicons name="alert-circle" size={13} color="#92400E" />
              <Text style={styles.reviewBadgeText}>Needs Review</Text>
            </View>
          )}

          {/* Metadata */}
          <View style={styles.meta}>
            <Text style={styles.fieldLabel}>CATEGORY</Text>
            <CategoryPicker value={category} onSave={c => { setCategory(c); persist({ category: c }); }} />

            <Text style={styles.fieldLabel}>TITLE</Text>
            <EditableText
              value={title}
              label="Title"
              onSave={v => { setTitle(v); persist({ title: v }); }}
              textStyle={styles.title}
              placeholder="Add a title"
            />

            <Text style={styles.fieldLabel}>DESCRIPTION</Text>
            <EditableText
              value={description}
              label="Description"
              onSave={v => { setDescription(v); persist({ description: v }); }}
              multiline
              textStyle={styles.description}
              placeholder="Add a description"
            />

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
                  <Text style={[styles.infoText, { color: colors.success }]}>${s.earnings.toFixed(2)} earned</Text>
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

            <View style={styles.divider} />

            <Text style={styles.fieldLabel}>KEYWORDS</Text>
            <KeywordsEditor keywords={keywords} onSave={kw => { setKeywords(kw); persist({ keywords: kw }); }} />
          </View>
        </View>

        {/* Delete */}
        <TouchableOpacity style={styles.deleteBtn} onPress={confirmDelete} disabled={deleting} activeOpacity={0.8}>
          {deleting ? (
            <ActivityIndicator size="small" color={colors.error} />
          ) : (
            <>
              <Ionicons name="trash-outline" size={18} color={colors.error} />
              <Text style={styles.deleteText}>Delete Photo</Text>
            </>
          )}
        </TouchableOpacity>
        <Text style={styles.deleteHint}>Removes this photo and its listing from Adobe Stock.</Text>
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
  closeBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: typography.sizes.md, fontFamily: typography.weights.semibold, color: colors.dark },
  savingSlot: { width: 32, alignItems: 'flex-end' },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxxl },
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
  photo: { width: '100%', height: CARD_HEIGHT * 0.5, backgroundColor: colors.offWhite },
  statusBadge: {
    position: 'absolute', top: spacing.md, left: spacing.md,
    paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.full,
  },
  statusBadgeText: { fontSize: 11, fontFamily: typography.weights.semibold },
  reviewBadge: {
    position: 'absolute', top: spacing.md, right: spacing.md,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#F59E0B',
    paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.full,
  },
  reviewBadgeText: { fontSize: 11, fontFamily: typography.weights.semibold, color: '#92400E' },
  meta: { padding: spacing.lg, gap: spacing.xs },
  fieldLabel: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.weights.semibold,
    color: colors.midGray,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: spacing.sm,
  },
  title: { fontSize: typography.sizes.lg, fontFamily: typography.weights.bold, color: colors.dark, lineHeight: 26 },
  description: { fontSize: typography.sizes.sm, color: colors.darkGray, lineHeight: 20 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  infoText: { fontSize: typography.sizes.sm, color: colors.darkGray },
  reviewNote: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    backgroundColor: '#FFFBEB', padding: spacing.sm, borderRadius: borderRadius.sm, marginTop: spacing.xs,
  },
  reviewNoteText: { fontSize: typography.sizes.xs, color: '#92400E', flex: 1 },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.error,
    backgroundColor: '#FEECEC',
  },
  deleteText: { fontSize: typography.sizes.md, fontFamily: typography.weights.bold, color: colors.error },
  deleteHint: { fontSize: typography.sizes.xs, color: colors.midGray, textAlign: 'center', marginTop: spacing.sm },
});
