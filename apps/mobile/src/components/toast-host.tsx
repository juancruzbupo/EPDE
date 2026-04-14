import { CheckCircle2, CircleAlert, Info } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { type ToastEvent, toastEvent, type ToastVariant } from '@/lib/toast';

const DEFAULT_DURATION = 3000;
const MAX_STACK = 3;

const VARIANT_STYLES: Record<
  ToastVariant,
  { bg: string; text: string; Icon: typeof CheckCircle2 }
> = {
  success: { bg: 'bg-success', text: 'text-white', Icon: CheckCircle2 },
  error: { bg: 'bg-destructive', text: 'text-white', Icon: CircleAlert },
  info: { bg: 'bg-primary', text: 'text-white', Icon: Info },
};

/**
 * Root-mounted toast queue. Listens to the `toastEvent` emitter and renders
 * a stack of auto-dismissing snackbars at the top of the screen, below the
 * safe-area inset.
 *
 * Implementation keeps it deliberately simple:
 *  - A FIFO array capped at MAX_STACK visible toasts.
 *  - Each toast schedules its own setTimeout dismissal.
 *  - No Reanimated for now — Reanimated 4 + SSR guard interactions on Expo 54
 *    add bootstrapping surface we don't need here. If we want motion we can
 *    layer it later without changing the emitter contract.
 */
// Top offset below the system status bar. Fixed rather than computed via
// useSafeAreaInsets to avoid requiring a SafeAreaProvider ancestor — this host
// mounts at the app root, outside the route stack's provider tree.
const TOP_OFFSET = Platform.OS === 'ios' ? 60 : 40;

export function ToastHost() {
  const [stack, setStack] = useState<ToastEvent[]>([]);

  useEffect(() => {
    return toastEvent.subscribe((event) => {
      setStack((prev) => [...prev, event].slice(-MAX_STACK));
      const duration = event.duration ?? DEFAULT_DURATION;
      setTimeout(() => {
        setStack((prev) => prev.filter((t) => t.id !== event.id));
      }, duration);
    });
  }, []);

  if (stack.length === 0) return null;

  return (
    <View pointerEvents="none" style={[styles.container, { top: TOP_OFFSET }]} className="gap-2">
      {stack.map((t) => {
        const { bg, text, Icon } = VARIANT_STYLES[t.variant];
        return (
          <View
            key={t.id}
            className={`${bg} mx-4 flex-row items-center gap-2 rounded-xl px-4 py-3 shadow-lg`}
          >
            <Icon size={20} color="white" />
            <Text className={`${text} flex-1 text-sm font-medium`}>{t.message}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 9999,
  },
});
