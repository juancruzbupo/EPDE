import '@/lib/sentry';
import '../global.css';

import { validateCertPinning } from '@/lib/cert-pinning';

validateCertPinning();

import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
  useFonts,
} from '@expo-google-fonts/dm-sans';
import { DMSerifDisplay_400Regular } from '@expo-google-fonts/dm-serif-display';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import * as Linking from 'expo-linking';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { useColorScheme, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ConfettiBurst, type ConfettiBurstRef } from '@/components/confetti-burst';
import { ErrorBoundary } from '@/components/error-boundary';
import { confettiEvent } from '@/lib/confetti-event';
import { registerForPushNotifications } from '@/lib/push-notifications';
import { queryClient } from '@/lib/query-client';
import { asyncStoragePersister, PERSISTER_MAX_AGE } from '@/lib/query-persister';
import { darkTheme, lightTheme } from '@/lib/theme-tokens';
import { useAuthStore } from '@/stores/auth-store';
import { useThemeStore } from '@/stores/theme-store';

SplashScreen.preventAutoHideAsync();

function AuthGate() {
  const router = useRouter();
  const segments = useSegments();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const subscriptionExpired = useAuthStore((s) => s.subscriptionExpired);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (subscriptionExpired && !inAuthGroup) {
      router.replace('/(auth)/subscription-expired' as never);
    } else if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup && !subscriptionExpired) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, subscriptionExpired, segments, router]);

  // Register push notifications when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      void registerForPushNotifications();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      const { path } = Linking.parse(event.url);
      const allowedPaths = [
        'property',
        'task',
        'budget',
        'service-requests',
        'login',
        'set-password',
        'reset-password',
      ];
      const firstSegment = path?.split('/')[0];
      if (firstSegment && !allowedPaths.includes(firstSegment)) {
        console.warn(`Blocked unrecognized deep link path: ${path}`);
        router.replace('/(tabs)');
      }
    };
    const sub = Linking.addEventListener('url', handleDeepLink);
    return () => sub.remove();
  }, []);

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  const checkAuth = useAuthStore((s) => s.checkAuth);
  const systemColorScheme = useColorScheme();
  const mode = useThemeStore((s) => s.mode);
  const loadSavedTheme = useThemeStore((s) => s.loadSavedTheme);

  const effectiveTheme = mode === 'auto' ? (systemColorScheme ?? 'light') : mode;
  const themeVars = effectiveTheme === 'dark' ? darkTheme : lightTheme;

  const [fontsLoaded, fontError] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
    DMSerifDisplay_400Regular,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    void loadSavedTheme();
  }, [loadSavedTheme]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  const confettiRef = useRef<ConfettiBurstRef>(null);
  useEffect(() => {
    const unsubscribe = confettiEvent.subscribe(() => confettiRef.current?.fire());
    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={themeVars} className="bg-background flex-1">
        <ConfettiBurst ref={confettiRef} />
        <ErrorBoundary>
          <PersistQueryClientProvider
            client={queryClient}
            persistOptions={{
              persister: asyncStoragePersister,
              maxAge: PERSISTER_MAX_AGE,
              // Never persist PII-containing domains to AsyncStorage (plaintext on Android
              // `/data/data/...`). Dashboard, notifications, categories and templates are
              // safe to persist. Tokens live in SecureStore, not in this cache.
              dehydrateOptions: {
                shouldDehydrateQuery: (query) => {
                  const key = query.queryKey[0];
                  if (typeof key !== 'string') return false;
                  const SENSITIVE = [
                    'properties',
                    'budgets',
                    'serviceRequests',
                    'inspections',
                    'tasks',
                    'maintenancePlans',
                    'plans',
                    'clients',
                  ];
                  return !SENSITIVE.includes(key);
                },
              },
            }}
          >
            <AuthGate />
            <StatusBar style={effectiveTheme === 'dark' ? 'light' : 'dark'} />
          </PersistQueryClientProvider>
        </ErrorBoundary>
      </View>
    </GestureHandlerRootView>
  );
}
