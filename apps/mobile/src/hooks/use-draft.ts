import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef } from 'react';
import type { FieldValues, UseFormReturn } from 'react-hook-form';
import { Alert } from 'react-native';

/**
 * Persists form state to AsyncStorage as a draft.
 * Restores on mount, clears on submit.
 *
 * @param key Unique key for the draft (e.g., 'draft:budget:create')
 * @param form React Hook Form instance
 */
export function useDraft<T extends FieldValues>(key: string, form: UseFormReturn<T>) {
  const restored = useRef(false);

  // Restore draft on mount
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;

    void AsyncStorage.getItem(key).then((saved) => {
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as T;
          form.reset(parsed);
          Alert.alert('Borrador', 'Se restauró un borrador guardado.');
        } catch {
          void AsyncStorage.removeItem(key);
        }
      }
    });
  }, [key, form]);

  // Save draft on change
  useEffect(() => {
    const subscription = form.watch((values) => {
      void AsyncStorage.setItem(key, JSON.stringify(values)).catch(() => {});
    });
    return () => subscription.unsubscribe();
  }, [key, form]);

  /** Call on successful submit to clear the draft. */
  const clearDraft = useCallback(() => {
    void AsyncStorage.removeItem(key);
  }, [key]);

  return { clearDraft };
}
