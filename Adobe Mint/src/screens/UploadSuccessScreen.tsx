import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, typography, spacing, borderRadius } from '../theme';
import type { RootStackParamList } from '../types';
import Button from '../components/Button';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'UploadSuccess'>;

export default function UploadSuccessScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { count, flaggedCount } = route.params;
  const autoApproved = count - flaggedCount;
  const allFlagged = flaggedCount === count;
  const someFlagged = flaggedCount > 0 && !allFlagged;

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 80,
        friction: 6,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Animated.View style={[styles.iconContainer, { transform: [{ scale: scaleAnim }] }]}>
          <Ionicons name="checkmark-circle" size={80} color={colors.success} />
        </Animated.View>

        <Animated.View style={[styles.textSection, { opacity: fadeAnim }]}>
          <Text style={styles.title}>
            {allFlagged
              ? count === 1 ? 'Sent for Review' : `${count} Photos Sent for Review`
              : count === 1 ? 'Photo Uploaded!' : `${count} Photos Uploaded!`}
          </Text>
          <Text style={styles.subtitle}>
            {allFlagged
              ? `Our moderator will review ${count === 1 ? 'your photo' : 'your photos'} and you'll be notified once ${count === 1 ? "it's" : "they're"} approved and live on Adobe Stock.`
              : someFlagged
              ? `${autoApproved} ${autoApproved === 1 ? 'photo is' : 'photos are'} live on Adobe Stock. ${flaggedCount} ${flaggedCount === 1 ? 'photo needs' : 'photos need'} moderator review — you'll be notified when ${flaggedCount === 1 ? "it's" : "they're"} approved.`
              : `${count === 1 ? 'Your photo is' : 'Your photos are'} live on Adobe Stock and visible to over 1 million buyers right now.`}
          </Text>

          <View style={styles.timelineCard}>
            {allFlagged || someFlagged ? (
              <>
                <TimelineItem icon="shield-checkmark-outline" label="Moderator Review" detail="Usually within 24 hours" active />
                <TimelineItem icon="checkmark-outline" label="Approval & Goes Live" detail="Visible to 1M+ buyers" />
                <TimelineItem icon="cash-outline" label="Start Earning" detail="$0.33–$3.30 per download" />
              </>
            ) : (
              <>
                <TimelineItem icon="flash-outline" label="AI Approved & Live" detail="Already visible to buyers" active />
                <TimelineItem icon="trending-up-outline" label="Getting Discovered" detail="Indexed in Adobe Stock search" />
                <TimelineItem icon="cash-outline" label="Earning on Downloads" detail="$0.33–$3.30 per download" />
              </>
            )}
          </View>
        </Animated.View>

        <Animated.View style={[styles.actions, { opacity: fadeAnim }]}>
          <Button
            label="View Earnings Dashboard"
            onPress={() => navigation.replace('Main')}
            size="lg"
            style={styles.primaryBtn}
          />
          <Button
            label="Mint More Photos"
            onPress={() => navigation.replace('Main')}
            variant="secondary"
            size="lg"
          />
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

function TimelineItem({
  icon,
  label,
  detail,
  active = false,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  detail: string;
  active?: boolean;
}) {
  return (
    <View style={tlStyles.row}>
      <View style={[tlStyles.iconWrap, active && tlStyles.iconWrapActive]}>
        <Ionicons name={icon} size={18} color={active ? colors.primary : colors.midGray} />
      </View>
      <View style={tlStyles.text}>
        <Text style={[tlStyles.label, active && tlStyles.labelActive]}>{label}</Text>
        <Text style={tlStyles.detail}>{detail}</Text>
      </View>
    </View>
  );
}

const tlStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.offWhite,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: '#FFF0EF',
  },
  text: {
    flex: 1,
  },
  label: {
    fontSize: typography.sizes.md,
    fontFamily: typography.weights.medium,
    color: colors.darkGray,
  },
  labelActive: {
    color: colors.dark,
    fontFamily: typography.weights.semibold,
  },
  detail: {
    fontSize: typography.sizes.sm,
    color: colors.midGray,
    marginTop: 2,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.xxl,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: spacing.xxl,
  },
  textSection: {
    alignItems: 'center',
    flex: 1,
    width: '100%',
  },
  title: {
    fontSize: typography.sizes.xxxl,
    fontFamily: typography.weights.heavy,
    color: colors.dark,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.midGray,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  timelineCard: {
    width: '100%',
    backgroundColor: colors.offWhite,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actions: {
    width: '100%',
    gap: spacing.md,
  },
  primaryBtn: {
    borderRadius: borderRadius.lg,
  },
});
