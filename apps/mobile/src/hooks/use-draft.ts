// Web equivalent: apps/web/src/hooks/use-draft.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef } from 'react';
import type { FieldValues, UseFormReturn } from 'react-hook-form';
import { Alert } from 'react-native';

/**
 * Persists form state to AsyncStorage as a draft.
 * Only saves when the form is dirty (user made changes beyond defaults).
 * Restores on mount if a meaningful draft exists.
 *
 * @param key Unique key for the draft (e.g., 'draft:budget:create')
 * @param form React Hook Form instance
 * @param enabled Whether draft persistence is active (e.g., only when modal is visible)
 */
export function useDraft<T extends FieldValues>(
  key: string,
  form: UseFormReturn<T>,
  enabled = true,
) {
  const restored = useRef(false);

  // Restore draft on mount (only if enabled)
  useEffect(() => {
    if (!enabled || restored.current) return;
    restored.current = true;

    void AsyncStorage.getItem(key).then((saved) => {
      if (!saved) return;

      try {
        const parsed = JSON.parse(saved) as T;

        // Only restore if the draft has meaningful content
        const hasContent = Object.values(parsed).some((v) => {
          if (v === null || v === undefined || v === '') return false;
          if (Array.isArray(v) && v.length === 0) return false;
          return true;
        });

        if (hasContent) {
          form.reset(parsed);
          Alert.alert('Borrador', 'Se restauró un borrador guardado.');
        } else {
          void AsyncStorage.removeItem(key);
        }
      } catch {
        void AsyncStorage.removeItem(key);
      }
    });
  }, [key, form, enabled]);

  // Save draft on change — only when form is dirty
  useEffect(() => {
    if (!enabled) return;

    const subscription = form.watch(() => {
      if (!form.formState.isDirty) return;
      void AsyncStorage.setItem(key, JSON.stringify(form.getValues())).catch(() => {});
    });
    return () => subscription.unsubscribe();
  }, [key, form, enabled]);

  // Reset restored flag when disabled so next open can restore
  useEffect(() => {
    if (!enabled) {
      restored.current = false;
    }
  }, [enabled]);

  /** Call on successful submit to clear the draft. */
  const clearDraft = useCallback(() => {
    void AsyncStorage.removeItem(key);
  }, [key]);

  return { clearDraft };
}
