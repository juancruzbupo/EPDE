'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { FieldValues, UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';

/**
 * Persists form state to sessionStorage as a draft.
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

    try {
      const saved = sessionStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved) as T;
        form.reset(parsed);
        toast.info('Borrador restaurado');
      }
    } catch {
      sessionStorage.removeItem(key);
    }
  }, [key, form]);

  // Save draft on change (debounced via form watch)
  useEffect(() => {
    const subscription = form.watch((values) => {
      try {
        sessionStorage.setItem(key, JSON.stringify(values));
      } catch {
        // Storage full — ignore
      }
    });
    return () => subscription.unsubscribe();
  }, [key, form]);

  /** Call on successful submit to clear the draft. */
  const clearDraft = useCallback(() => {
    sessionStorage.removeItem(key);
  }, [key]);

  return { clearDraft };
}
