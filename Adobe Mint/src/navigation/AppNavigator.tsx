import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography } from '../theme';
import type { RootStackParamList, TabParamList } from '../types';

import OnboardingScreen from '../screens/OnboardingScreen';
import HomeScreen from '../screens/HomeScreen';
import TaggingScreen from '../screens/TaggingScreen';
import UploadSuccessScreen from '../screens/UploadSuccessScreen';
import EarningsScreen from '../screens/EarningsScreen';
import SettingsScreen from '../screens/ProfileScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingTop: 6,
          paddingBottom: 4,
          height: 60,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.midGray,
        tabBarLabelStyle: {
          fontSize: typography.sizes.xs,
          fontFamily: typography.weights.semibold,
          marginBottom: 2,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: React.ComponentProps<typeof Ionicons>['name'];
          if (route.name === 'Home') {
            iconName = focused ? 'images' : 'images-outline';
          } else if (route.name === 'Earnings') {
            iconName = focused ? 'trending-up' : 'trending-up-outline';
          } else {
            iconName = focused ? 'settings' : 'settings-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Discover' }} />
      <Tab.Screen name="Earnings" component={EarningsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

interface AppNavigatorProps {
  isOnboarded: boolean;
}

export default function AppNavigator({ isOnboarded }: AppNavigatorProps) {
  return (
    <Stack.Navigator
      initialRouteName={isOnboarded ? 'Main' : 'Onboarding'}
      screenOptions={{ headerShown: false, animation: 'fade' }}
    >
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen
        name="Tagging"
        component={TaggingScreen}
        options={{ animation: 'slide_from_bottom', presentation: 'modal' }}
      />
      <Stack.Screen
        name="UploadSuccess"
        component={UploadSuccessScreen}
        options={{ animation: 'fade', gestureEnabled: false }}
      />
    </Stack.Navigator>
  );
}
