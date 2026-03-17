import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { apiClient } from './api-client';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/** Request permission and register push token with the backend. */
export async function registerForPushNotifications(): Promise<string | null> {
  // Only real devices can receive push notifications
  if (!Device.isDevice) {
    return null;
  }

  // projectId is required for Expo Push — skip if not configured (local dev without EAS)
  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) {
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  // Android requires notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'EPDE',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });

    // Register with backend
    await apiClient.post('/notifications/push-token', {
      token,
      platform: Platform.OS,
    });

    return token;
  } catch {
    // Push registration failed (no EAS config, network error, etc.) — non-blocking
    return null;
  }
}

/** Remove push token from backend (call on logout). */
export async function unregisterPushToken(): Promise<void> {
  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) return;

  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await apiClient.delete('/notifications/push-token', { data: { token } });
  } catch {
    // Silent fail
  }
}
