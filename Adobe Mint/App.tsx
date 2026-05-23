import React, { useEffect, useState, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import AppNavigator from './src/navigation/AppNavigator';
import { colors } from './src/theme';
import { saveSession, loadSession } from './src/utils/session';

WebBrowser.maybeCompleteAuthSession();

export default function App() {
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const navigationRef = React.useRef<any>(null);

  const [fontsLoaded] = useFonts({
    'AdobeClean-Regular':   require('./assets/fonts/AdobeClean-Regular.otf'),
    'AdobeClean-Medium':    require('./assets/fonts/AdobeClean-Medium.otf'),
    'AdobeClean-Bold':      require('./assets/fonts/AdobeClean-Bold.otf'),
    'AdobeClean-ExtraBold': require('./assets/fonts/AdobeClean-ExtraBold.otf'),
    'AdobeClean-Black':     require('./assets/fonts/AdobeClean-Black.otf'),
    'AdobeClean-Light':     require('./assets/fonts/AdobeClean-Light.otf'),
  });

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem('onboarded'),
      loadSession(),
    ]).then(([onboarded, session]) => {
      setIsOnboarded(onboarded === 'true');
      setIsAuthenticated(!!session);
    }).catch(() => {
      setIsOnboarded(false);
      setIsAuthenticated(false);
    });
  }, []);

  // Handle OAuth deep-link return: com.adobe.mint://auth?session=TOKEN
  const handleDeepLink = useCallback(async (event: { url: string }) => {
    const { url } = event;
    if (!url.startsWith('com.adobe.mint://auth')) return;

    const parsed = Linking.parse(url);
    const sessionToken = parsed.queryParams?.session as string | undefined;
    const error = parsed.queryParams?.error as string | undefined;

    if (error) {
      console.warn('Adobe sign-in error:', error);
      return;
    }

    if (sessionToken) {
      // Decode the JWT payload (no verification — backend already verified)
      const [, payloadB64] = sessionToken.split('.');
      const payload = JSON.parse(
        atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'))
      );

      await saveSession({
        token: sessionToken,
        id:    payload.sub,
        email: payload.email,
        name:  payload.name ?? payload.email,
      });

      await AsyncStorage.setItem('onboarded', 'true');
      setIsAuthenticated(true);
      setIsOnboarded(true);

      // Navigate to main if navigator is ready
      navigationRef.current?.reset({ index: 0, routes: [{ name: 'Main' }] });
    }
  }, []);

  useEffect(() => {
    // Handle deep link if app was opened from one
    Linking.getInitialURL().then(url => {
      if (url) handleDeepLink({ url });
    });
    const sub = Linking.addEventListener('url', handleDeepLink);
    return () => sub.remove();
  }, [handleDeepLink]);

  if (isOnboarded === null || isAuthenticated === null || !fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef}>
        <StatusBar style="dark" />
        <AppNavigator isOnboarded={isOnboarded} />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
