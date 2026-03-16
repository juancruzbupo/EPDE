import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { apiClient } from './api-client';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
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

  const { data: token } = await Notifications.getExpoPushTokenAsync();

  // Register with backend
  try {
    await apiClient.post('/notifications/push-token', {
      token,
      platform: Platform.OS,
    });
  } catch {
    // Silent fail — push is best-effort
  }

  return token;
}

/** Remove push token from backend (call on logout). */
export async function unregisterPushToken(): Promise<void> {
  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync();
    await apiClient.delete('/notifications/push-token', { data: { token } });
  } catch {
    // Silent fail
  }
}
