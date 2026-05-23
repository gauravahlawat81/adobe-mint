import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, typography, spacing, borderRadius } from '../theme';
import { clearSession, loadSession, type Session } from '../utils/session';
import { getStats, type Stats } from '../utils/api';
import type { RootStackParamList } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface SettingRowProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value?: string;
  onPress?: () => void;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (v: boolean) => void;
  danger?: boolean;
}

function SettingRow({ icon, label, value, onPress, toggle, toggleValue, onToggle, danger }: SettingRowProps) {
  return (
    <TouchableOpacity style={styles.settingRow} onPress={onPress} disabled={!onPress && !toggle}>
      <View style={[styles.settingIcon, danger && styles.settingIconDanger]}>
        <Ionicons name={icon} size={20} color={danger ? colors.error : colors.darkGray} />
      </View>
      <Text style={[styles.settingLabel, danger && styles.settingLabelDanger]}>{label}</Text>
      <View style={styles.settingRight}>
        {value && <Text style={styles.settingValue}>{value}</Text>}
        {toggle ? (
          <Switch
            value={toggleValue}
            onValueChange={onToggle}
            trackColor={{ true: colors.primary, false: colors.border }}
            thumbColor={colors.white}
          />
        ) : (
          !danger && <Ionicons name="chevron-forward" size={16} color={colors.lightGray} />
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const [notifications, setNotifications] = React.useState(true);
  const [autoTag, setAutoTag] = React.useState(true);
  const [session, setSession] = React.useState<Session | null>(null);
  const [stats, setStats] = React.useState<Stats | null>(null);

  React.useEffect(() => {
    loadSession().then(s => {
      setSession(s);
      if (s) getStats().then(setStats).catch(() => {});
    });
  }, []);

  const displayName = session?.name ?? 'Guest';
  const displayEmail = session?.email ?? 'No account signed in';
  const initials = displayName
    .split(' ')
    .map((w: string) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'G';

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await clearSession();
            await AsyncStorage.removeItem('onboarded');
            navigation.reset({ index: 0, routes: [{ name: 'Onboarding' }] });
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Text style={styles.headerTitle}>Profile</Text>

        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{displayName}</Text>
            <Text style={styles.userEmail}>{displayEmail}</Text>
            <View style={styles.badgeRow}>
              <View style={styles.levelBadge}>
                <Text style={styles.levelBadgeText}>{session ? 'Contributor' : 'Guest'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          <StatBox label="Total Earned" value={`$${(stats?.totalEarnings ?? 0).toFixed(2)}`} />
          <StatBox label="Photos Approved" value={String(stats?.approvedCount ?? 0)} />
          <StatBox label="Submitted" value={String(stats?.totalCount ?? 0)} />
          <StatBox label="Downloads" value={String(stats?.totalDownloads ?? 0)} />
        </View>

        {/* Account Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.settingGroup}>
            <SettingRow
              icon="person-outline"
              label="Edit Profile"
              onPress={() => {}}
            />
            <SettingRow
              icon="card-outline"
              label="Payment Method"
              value="PayPal"
              onPress={() => {}}
            />
            <SettingRow
              icon="shield-checkmark-outline"
              label="Adobe Stock Agreement"
              onPress={() => {}}
            />
          </View>
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.settingGroup}>
            <SettingRow
              icon="notifications-outline"
              label="Push Notifications"
              toggle
              toggleValue={notifications}
              onToggle={setNotifications}
            />
            <SettingRow
              icon="sparkles-outline"
              label="Auto AI Tagging"
              toggle
              toggleValue={autoTag}
              onToggle={setAutoTag}
            />
            <SettingRow
              icon="language-outline"
              label="Language"
              value="English"
              onPress={() => {}}
            />
          </View>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.settingGroup}>
            <SettingRow
              icon="help-circle-outline"
              label="Help Center"
              onPress={() => {}}
            />
            <SettingRow
              icon="chatbubble-outline"
              label="Contact Support"
              onPress={() => {}}
            />
            <SettingRow
              icon="star-outline"
              label="Rate Adobe Mint"
              onPress={() => {}}
            />
          </View>
        </View>

        {/* Sign out */}
        <View style={styles.section}>
          <View style={styles.settingGroup}>
            <SettingRow
              icon="log-out-outline"
              label="Sign Out"
              onPress={handleSignOut}
              danger
            />
          </View>
        </View>

        <Text style={styles.version}>Adobe Mint v1.0.0 · Adobe Inc.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scroll: {
    paddingBottom: spacing.xxxl,
  },
  headerTitle: {
    fontSize: typography.sizes.xxl,
    fontFamily: typography.weights.bold,
    color: colors.dark,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    backgroundColor: colors.offWhite,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: typography.sizes.xl,
    fontFamily: typography.weights.bold,
    color: colors.white,
  },
  userInfo: {
    flex: 1,
    gap: 3,
  },
  userName: {
    fontSize: typography.sizes.lg,
    fontFamily: typography.weights.bold,
    color: colors.dark,
  },
  userEmail: {
    fontSize: typography.sizes.sm,
    color: colors.midGray,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  levelBadge: {
    backgroundColor: '#FFF0EF',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  levelBadgeText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.weights.semibold,
    color: colors.primary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  statBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.offWhite,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.sizes.xl,
    fontFamily: typography.weights.bold,
    color: colors.dark,
    marginBottom: 3,
  },
  statLabel: {
    fontSize: typography.sizes.xs,
    color: colors.midGray,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.weights.semibold,
    color: colors.midGray,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  settingGroup: {
    backgroundColor: colors.offWhite,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  settingIcon: {
    width: 34,
    height: 34,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  settingIconDanger: {
    backgroundColor: '#FEECEC',
    borderColor: '#FEECEC',
  },
  settingLabel: {
    flex: 1,
    fontSize: typography.sizes.md,
    color: colors.dark,
    fontFamily: typography.weights.medium,
  },
  settingLabelDanger: {
    color: colors.error,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  settingValue: {
    fontSize: typography.sizes.sm,
    color: colors.midGray,
  },
  version: {
    fontSize: typography.sizes.xs,
    color: colors.lightGray,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
