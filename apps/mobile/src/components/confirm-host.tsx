import { useEffect, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

import { type ConfirmEvent, subscribe } from '@/lib/confirm';
import { useType } from '@/lib/fonts';
import { haptics } from '@/lib/haptics';

/**
 * Root-mounted host that listens to the `confirm()` emitter and renders a
 * modal with explicit confirm/cancel labels. See lib/confirm.ts for the API
 * rationale.
 *
 * Only one confirmation shown at a time — if `confirm()` fires while another
 * is open, the new one queues behind it. In practice this shouldn't happen
 * (user can only trigger one destructive action at a time), but the guard
 * is free.
 */
export function ConfirmHost() {
  const [current, setCurrent] = useState<ConfirmEvent | null>(null);
  const [queue, setQueue] = useState<ConfirmEvent[]>([]);
  const TYPE = useType();

  useEffect(() => {
    return subscribe((event) => {
      setQueue((q) => [...q, event]);
    });
  }, []);

  useEffect(() => {
    if (!current && queue.length > 0) {
      setCurrent(queue[0]);
      setQueue((q) => q.slice(1));
    }
  }, [current, queue]);

  if (!current) return null;

  function resolve(confirmed: boolean) {
    if (!current) return;
    current.resolve(confirmed);
    haptics.selection();
    setCurrent(null);
  }

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => resolve(false)}
    >
      <Pressable
        onPress={() => resolve(false)}
        className="flex-1 items-center justify-center bg-black/50 px-6"
        accessibilityRole="button"
        accessibilityLabel="Cerrar"
      >
        {/* stopPropagation — tapping inside the card doesn't dismiss */}
        <Pressable onPress={() => {}} className="bg-card w-full max-w-md rounded-2xl p-5">
          <Text style={TYPE.titleMd} className="text-foreground mb-2">
            {current.title}
          </Text>
          <Text style={TYPE.bodyMd} className="text-muted-foreground mb-5">
            {current.message}
          </Text>
          <View className="flex-row gap-3">
            <Pressable
              onPress={() => resolve(false)}
              accessibilityRole="button"
              accessibilityLabel={current.cancelLabel ?? 'Cancelar'}
              className="bg-muted flex-1 items-center rounded-xl py-3"
            >
              <Text style={TYPE.labelLg} className="text-foreground">
                {current.cancelLabel ?? 'Cancelar'}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => resolve(true)}
              accessibilityRole="button"
              accessibilityLabel={current.confirmLabel}
              className={`flex-1 items-center rounded-xl py-3 ${
                current.destructive ? 'bg-destructive' : 'bg-primary'
              }`}
            >
              <Text
                style={TYPE.labelLg}
                className={current.destructive ? 'text-white' : 'text-primary-foreground'}
              >
                {current.confirmLabel}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
