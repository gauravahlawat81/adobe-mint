import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleProp,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../theme';
import { STOCK_CATEGORIES } from '../constants/categories';
import type { StockCategory } from '../types';

// ─── FieldEditSheet ──────────────────────────────────────────────────────────
// A keyboard-aware bottom sheet for editing a single text field. Rises above the
// keyboard so the input is always visible; the screen behind stays put (dimmed).
interface SheetProps {
  visible: boolean;
  label: string;
  initialValue: string;
  multiline?: boolean;
  placeholder?: string;
  onClose: () => void;
  onSave: (v: string) => void;
}

function FieldEditSheet({ visible, label, initialValue, multiline, placeholder, onClose, onSave }: SheetProps) {
  const [draft, setDraft] = useState(initialValue);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setDraft(initialValue);
      // Focus slightly after the sheet animates in (reliable on Android)
      const t = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(t);
    }
  }, [visible, initialValue]);

  const save = () => { onSave(draft); onClose(); };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Edit {label}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={22} color={colors.midGray} />
            </TouchableOpacity>
          </View>
          <TextInput
            ref={inputRef}
            value={draft}
            onChangeText={setDraft}
            multiline={multiline}
            placeholder={placeholder}
            placeholderTextColor={colors.lightGray}
            style={[styles.sheetInput, multiline && styles.sheetInputMultiline]}
            onSubmitEditing={multiline ? undefined : save}
            blurOnSubmit={!multiline}
          />
          <TouchableOpacity style={styles.saveBtn} onPress={save} activeOpacity={0.85}>
            <Text style={styles.saveBtnText}>Save</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── EditableText ──────────────────────────────────────────────────────────
// Displays text with a pencil; tap to open the bottom-sheet editor.
interface EditableTextProps {
  value: string;
  onSave: (v: string) => void;
  label?: string;
  onEditingChange?: (editing: boolean) => void;
  multiline?: boolean;
  textStyle?: StyleProp<TextStyle>;
  placeholder?: string;
}

export function EditableText({ value, onSave, label, onEditingChange, multiline, textStyle, placeholder }: EditableTextProps) {
  const [open, setOpen] = useState(false);

  const begin = () => { setOpen(true); onEditingChange?.(true); };
  const close = () => { setOpen(false); onEditingChange?.(false); };

  return (
    <>
      <TouchableOpacity onPress={begin} activeOpacity={0.6} style={styles.editableRow}>
        <Text style={[textStyle, styles.editableText]}>{value || placeholder}</Text>
        <Ionicons name="pencil" size={13} color={colors.lightGray} style={styles.pencil} />
      </TouchableOpacity>
      <FieldEditSheet
        visible={open}
        label={label ?? 'field'}
        initialValue={value}
        multiline={multiline}
        placeholder={placeholder}
        onClose={close}
        onSave={v => { const t = v.trim(); if (t && t !== value) onSave(t); }}
      />
    </>
  );
}

// ─── KeywordsEditor ────────────────────────────────────────────────────────
// Shows chips; tap "Edit" to open the bottom-sheet editor (comma-separated list).
interface KeywordsEditorProps {
  keywords: string[];
  onSave: (kw: string[]) => void;
  onEditingChange?: (editing: boolean) => void;
}

export function KeywordsEditor({ keywords, onSave, onEditingChange }: KeywordsEditorProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <View style={styles.kwWrap}>
        {keywords.map(kw => (
          <View key={kw} style={styles.kwChip}>
            <Text style={styles.kwText}>{kw}</Text>
          </View>
        ))}
        <TouchableOpacity
          onPress={() => { setOpen(true); onEditingChange?.(true); }}
          style={styles.kwEditChip}
          activeOpacity={0.7}
        >
          <Ionicons name="pencil" size={12} color={colors.primary} />
          <Text style={styles.kwEditText}>Edit</Text>
        </TouchableOpacity>
      </View>
      <FieldEditSheet
        visible={open}
        label="Keywords"
        initialValue={keywords.join(', ')}
        multiline
        placeholder="keyword1, keyword2, keyword3…"
        onClose={() => { setOpen(false); onEditingChange?.(false); }}
        onSave={v => {
          const parsed = v.split(',').map(k => k.trim()).filter(Boolean).slice(0, 30);
          if (parsed.join('|') !== keywords.join('|')) onSave(parsed);
        }}
      />
    </>
  );
}

// ─── CategoryPicker ──────────────────────────────────────────────────────────
// Tappable badge that opens a bottom-sheet list of categories (no keyboard).
interface CategoryPickerProps {
  value: StockCategory;
  onSave: (c: StockCategory) => void;
}

export function CategoryPicker({ value, onSave }: CategoryPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TouchableOpacity style={styles.categoryBadge} onPress={() => setOpen(true)} activeOpacity={0.7}>
        <Text style={styles.categoryText}>{value}</Text>
        <Ionicons name="chevron-down" size={12} color={colors.primary} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)} statusBarTranslucent>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <View style={styles.categorySheet}>
          <Text style={styles.sheetTitle}>Choose category</Text>
          <ScrollView>
            {STOCK_CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat}
                style={styles.modalRow}
                onPress={() => { onSave(cat); setOpen(false); }}
              >
                <Text style={[styles.modalRowText, cat === value && styles.modalRowTextActive]}>{cat}</Text>
                {cat === value && <Ionicons name="checkmark" size={18} color={colors.primary} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  editableRow: { flexDirection: 'row', alignItems: 'flex-start' },
  editableText: { flexShrink: 1 },
  pencil: { marginLeft: 6, marginTop: 4 },

  // Bottom sheet
  kav: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sheetTitle: { fontSize: typography.sizes.lg, fontFamily: typography.weights.bold, color: colors.dark },
  sheetInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.dark,
    backgroundColor: colors.offWhite,
  },
  sheetInputMultiline: { minHeight: 96, textAlignVertical: 'top' },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  saveBtnText: { color: colors.white, fontFamily: typography.weights.bold, fontSize: typography.sizes.md },

  // Keywords
  kwWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, alignItems: 'center' },
  kwChip: {
    backgroundColor: colors.offWhite,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  kwText: { fontSize: 11, color: colors.darkGray, fontFamily: typography.weights.medium },
  kwEditChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFF0EF',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  kwEditText: { fontSize: 11, color: colors.primary, fontFamily: typography.weights.semibold },

  // Category
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#FFF0EF',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  categoryText: { fontSize: typography.sizes.xs, fontFamily: typography.weights.semibold, color: colors.primary },
  categorySheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    maxHeight: '70%',
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalRowText: { fontSize: typography.sizes.md, color: colors.dark },
  modalRowTextActive: { color: colors.primary, fontFamily: typography.weights.semibold },
});
