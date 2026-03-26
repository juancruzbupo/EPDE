import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/** No-op on web — expo-haptics is iOS/Android only. */
function guard(fn: () => Promise<void>): () => Promise<void> {
  return () => (Platform.OS === 'web' ? Promise.resolve() : fn());
}

export const haptics = {
  light: guard(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  medium: guard(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  heavy: guard(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)),
  success: guard(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  warning: guard(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
  error: guard(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
  selection: guard(() => Haptics.selectionAsync()),
};
