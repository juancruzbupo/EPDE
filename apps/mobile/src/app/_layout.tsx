import '@/lib/sentry';
import '../global.css';

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
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ErrorBoundary } from '@/components/error-boundary';
import { queryClient } from '@/lib/query-client';
import { asyncStoragePersister } from '@/lib/query-persister';
import { useAuthStore } from '@/stores/auth-store';

// TODO [ROADMAP]: Push notifications — requires expo-notifications,
// backend FCM/APNs integration, and user preference management.

SplashScreen.preventAutoHideAsync();

function AuthGate() {
  const router = useRouter();
  const segments = useSegments();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments, router]);

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

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{ persister: asyncStoragePersister }}
        >
          <AuthGate />
          <StatusBar style="auto" />
        </PersistQueryClientProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
