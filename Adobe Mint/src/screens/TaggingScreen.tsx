import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TextInput,
  TouchableOpacity,
  Dimensions,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, typography, spacing, borderRadius } from '../theme';
import type { Photo, TaggedPhoto, RootStackParamList } from '../types';
import { generateAITags } from '../utils/aiTagging';
import { postSubmission } from '../utils/api';
import Button from '../components/Button';
import TagChip from '../components/TagChip';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'Tagging'>;

const { width } = Dimensions.get('window');
const PREVIEW_SIZE = width * 0.38;

export default function TaggingScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { photos } = route.params;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [taggedPhotos, setTaggedPhotos] = useState<(TaggedPhoto | null)[]>(
    new Array(photos.length).fill(null)
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [uploading, setUploading] = useState(false);

  const spinAnim = useRef(new Animated.Value(0)).current;
  const contentFade = useRef(new Animated.Value(0)).current;

  const currentPhoto = photos[currentIndex];
  const currentTagged = taggedPhotos[currentIndex];

  useEffect(() => {
    analyzePhoto(currentIndex);
  }, [currentIndex]);

  const analyzePhoto = async (index: number) => {
    if (taggedPhotos[index]) return;
    setIsAnalyzing(true);
    contentFade.setValue(0);

    Animated.loop(
      Animated.timing(spinAnim, { toValue: 1, duration: 1200, useNativeDriver: true })
    ).start();

    try {
      const result = await generateAITags(photos[index]);
      setTaggedPhotos(prev => {
        const next = [...prev];
        next[index] = result;
        return next;
      });
      spinAnim.stopAnimation();
      Animated.timing(contentFade, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    } catch {
      setIsAnalyzing(false);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const updateTitle = (text: string) => {
    setTaggedPhotos(prev => {
      const next = [...prev];
      if (next[currentIndex]) next[currentIndex] = { ...next[currentIndex]!, title: text };
      return next;
    });
  };

  const updateDescription = (text: string) => {
    setTaggedPhotos(prev => {
      const next = [...prev];
      if (next[currentIndex]) next[currentIndex] = { ...next[currentIndex]!, description: text };
      return next;
    });
  };

  const removeKeyword = (keyword: string) => {
    setTaggedPhotos(prev => {
      const next = [...prev];
      if (next[currentIndex]) {
        next[currentIndex] = {
          ...next[currentIndex]!,
          keywords: next[currentIndex]!.keywords.filter(k => k !== keyword),
        };
      }
      return next;
    });
  };

  const addKeyword = () => {
    const tag = newTag.trim().toLowerCase();
    if (!tag || currentTagged?.keywords.includes(tag)) {
      setNewTag('');
      return;
    }
    setTaggedPhotos(prev => {
      const next = [...prev];
      if (next[currentIndex]) {
        next[currentIndex] = {
          ...next[currentIndex]!,
          keywords: [...next[currentIndex]!.keywords, tag],
        };
      }
      return next;
    });
    setNewTag('');
  };

  const handleUpload = async () => {
    const untagged = taggedPhotos.filter(t => t === null).length;
    if (untagged > 0) {
      Alert.alert('Still Analyzing', 'Please wait for all photos to be tagged before uploading.');
      return;
    }
    setUploading(true);
    try {
      await Promise.all(
        (taggedPhotos as TaggedPhoto[]).map(tagged =>
          postSubmission({
            title:           tagged.title,
            description:     tagged.description,
            keywords:        tagged.keywords,
            category:        tagged.category,
            thumbnail_uri:   tagged.photo.uri,
            requires_review: tagged.requiresReview,
            review_reason:   tagged.reviewReason ?? null,
            photo_hash:      tagged.photoHash ?? null,
          }).catch(() => null) // best-effort; still navigate on partial failure
        )
      );
    } catch {
      // guest user with no session — silently continue
    } finally {
      setUploading(false);
    }
    const flaggedCount = taggedPhotos.filter(t => t?.requiresReview).length;
    navigation.replace('UploadSuccess', { count: photos.length, flaggedCount });
  };

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.dark} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>AI Tagging</Text>
            {photos.length > 1 && (
              <Text style={styles.headerSub}>{currentIndex + 1} of {photos.length}</Text>
            )}
          </View>
          <TouchableOpacity onPress={handleUpload} disabled={uploading}>
            {uploading
              ? <ActivityIndicator color={colors.primary} />
              : <Text style={styles.uploadAllText}>Upload All</Text>
            }
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Photo strip (multiple) */}
          {photos.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.strip}
              style={styles.stripContainer}
            >
              {photos.map((photo, i) => (
                <TouchableOpacity
                  key={photo.id}
                  onPress={() => setCurrentIndex(i)}
                  style={[styles.stripItem, i === currentIndex && styles.stripItemActive]}
                >
                  <Image source={{ uri: photo.uri }} style={styles.stripThumb} />
                  {taggedPhotos[i] && (
                    <View style={styles.stripCheck}>
                      <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Main photo preview */}
          <View style={styles.previewSection}>
            <Image source={{ uri: currentPhoto.uri }} style={styles.preview} />
          </View>

          {/* AI Status */}
          <View style={styles.aiStatus}>
            {isAnalyzing ? (
              <View style={styles.aiAnalyzing}>
                <Animated.View style={{ transform: [{ rotate: spin }] }}>
                  <Ionicons name="sparkles" size={16} color={colors.primary} />
                </Animated.View>
                <Text style={styles.aiAnalyzingText}>AI is analyzing your photo…</Text>
              </View>
            ) : currentTagged ? (
              <View style={styles.aiDone}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <Text style={styles.aiDoneText}>AI tagging complete</Text>
                <View style={[styles.badge, { backgroundColor: '#EBF3FE' }]}>
                  <Text style={[styles.badgeText, { color: colors.info }]}>{currentTagged.category}</Text>
                </View>
              </View>
            ) : null}
          </View>

          {/* Metadata fields */}
          {currentTagged && (
            <Animated.View style={{ opacity: contentFade }}>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Title</Text>
                <TextInput
                  style={styles.input}
                  value={currentTagged.title}
                  onChangeText={updateTitle}
                  placeholder="Stock photo title"
                  placeholderTextColor={colors.lightGray}
                  multiline={false}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Description</Text>
                <TextInput
                  style={[styles.input, styles.inputMultiline]}
                  value={currentTagged.description}
                  onChangeText={updateDescription}
                  placeholder="Describe this photo for buyers"
                  placeholderTextColor={colors.lightGray}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.fieldGroup}>
                <View style={styles.fieldLabelRow}>
                  <Text style={styles.fieldLabel}>Keywords</Text>
                  <Text style={styles.fieldCount}>{currentTagged.keywords.length}/50</Text>
                </View>
                <View style={styles.tagsContainer}>
                  {currentTagged.keywords.map(kw => (
                    <TagChip key={kw} label={kw} onRemove={() => removeKeyword(kw)} />
                  ))}
                  <View style={styles.addTagRow}>
                    <TextInput
                      style={styles.tagInput}
                      value={newTag}
                      onChangeText={setNewTag}
                      placeholder="Add keyword…"
                      placeholderTextColor={colors.lightGray}
                      onSubmitEditing={addKeyword}
                      returnKeyType="done"
                    />
                    {newTag.length > 0 && (
                      <TouchableOpacity onPress={addKeyword} style={styles.addTagBtn}>
                        <Ionicons name="add" size={20} color={colors.primary} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            </Animated.View>
          )}

          {/* Upload CTA */}
          <View style={styles.uploadSection}>
            <Button
              label={
                photos.length > 1
                  ? currentIndex < photos.length - 1
                    ? `Next Photo →`
                    : `Upload ${photos.length} Photos to Adobe Stock`
                  : 'Upload to Adobe Stock'
              }
              onPress={() => {
                if (photos.length > 1 && currentIndex < photos.length - 1) {
                  setCurrentIndex(i => i + 1);
                } else {
                  handleUpload();
                }
              }}
              loading={uploading}
              disabled={!currentTagged}
              size="lg"
              style={styles.uploadButton}
            />
            {currentTagged?.requiresReview ? (
              <View style={styles.reviewWarning}>
                <Ionicons name="alert-circle-outline" size={14} color={colors.warning} />
                <Text style={styles.reviewWarningText}>
                  {currentTagged.reviewReason
                    ? `Needs moderator review: ${currentTagged.reviewReason}`
                    : 'A moderator will review this photo before it goes live.'}
                </Text>
              </View>
            ) : currentTagged ? (
              <View style={styles.aiApprovedNote}>
                <Ionicons name="checkmark-circle-outline" size={14} color={colors.success} />
                <Text style={styles.aiApprovedText}>AI approved · Uploads directly to Adobe Stock</Text>
              </View>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.xs,
    marginLeft: -spacing.xs,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.sizes.lg,
    fontFamily: typography.weights.bold,
    color: colors.dark,
  },
  headerSub: {
    fontSize: typography.sizes.xs,
    color: colors.midGray,
    marginTop: 1,
  },
  uploadAllText: {
    fontSize: typography.sizes.md,
    fontFamily: typography.weights.semibold,
    color: colors.primary,
  },
  scroll: {
    paddingBottom: spacing.xxxl,
  },
  stripContainer: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  strip: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  stripItem: {
    position: 'relative',
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  stripItemActive: {
    borderColor: colors.primary,
  },
  stripThumb: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.sm - 2,
  },
  stripCheck: {
    position: 'absolute',
    bottom: 3,
    right: 3,
    backgroundColor: colors.white,
    borderRadius: 7,
  },
  previewSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    alignItems: 'center',
  },
  preview: {
    width: PREVIEW_SIZE,
    height: PREVIEW_SIZE,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.offWhite,
  },
  aiStatus: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    minHeight: 36,
  },
  aiAnalyzing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  aiAnalyzingText: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
    fontFamily: typography.weights.medium,
  },
  aiDone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  aiDoneText: {
    fontSize: typography.sizes.sm,
    color: colors.success,
    fontFamily: typography.weights.medium,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  badgeText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.weights.semibold,
  },
  fieldGroup: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  fieldLabel: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.weights.semibold,
    color: colors.darkGray,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  fieldCount: {
    fontSize: typography.sizes.xs,
    color: colors.midGray,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.dark,
    backgroundColor: colors.white,
  },
  inputMultiline: {
    minHeight: 80,
    paddingTop: spacing.md,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    minHeight: 60,
  },
  addTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 100,
  },
  tagInput: {
    flex: 1,
    fontSize: typography.sizes.sm,
    color: colors.dark,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  addTagBtn: {
    padding: spacing.xs,
  },
  uploadSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  uploadButton: {
    borderRadius: borderRadius.lg,
  },
  reviewWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    backgroundColor: '#FDF3E4',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  reviewWarningText: {
    flex: 1,
    fontSize: typography.sizes.xs,
    color: colors.warning,
    lineHeight: 18,
  },
  aiApprovedNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  aiApprovedText: {
    fontSize: typography.sizes.xs,
    color: colors.success,
  },
});
