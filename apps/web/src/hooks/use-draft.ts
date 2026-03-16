'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { FieldValues, UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';

/**
 * Persists form state to sessionStorage as a draft.
 * Only saves when the form is dirty (user made changes beyond defaults).
 * Restores on mount if a meaningful draft exists.
 *
 * @param key Unique key for the draft (e.g., 'draft:budget:create')
 * @param form React Hook Form instance
 * @param enabled Whether draft persistence is active (e.g., only when dialog is open)
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

    try {
      const saved = sessionStorage.getItem(key);
      if (!saved) return;

      const parsed = JSON.parse(saved) as T;

      // Only restore if the draft has meaningful content (not just empty defaults)
      const hasContent = Object.values(parsed).some((v) => {
        if (v === null || v === undefined || v === '') return false;
        if (Array.isArray(v) && v.length === 0) return false;
        return true;
      });

      if (hasContent) {
        form.reset(parsed);
        toast.info('Borrador restaurado');
      } else {
        sessionStorage.removeItem(key);
      }
    } catch {
      sessionStorage.removeItem(key);
    }
  }, [key, form, enabled]);

  // Save draft on change — only when form is dirty (user modified something)
  useEffect(() => {
    if (!enabled) return;

    const subscription = form.watch(() => {
      // Only persist if user actually changed something
      if (!form.formState.isDirty) return;

      try {
        sessionStorage.setItem(key, JSON.stringify(form.getValues()));
      } catch {
        // Storage full — ignore
      }
    });
    return () => subscription.unsubscribe();
  }, [key, form, enabled]);

  // Reset restored flag when disabled (dialog closed) so next open can restore
  useEffect(() => {
    if (!enabled) {
      restored.current = false;
    }
  }, [enabled]);

  /** Call on successful submit to clear the draft. */
  const clearDraft = useCallback(() => {
    sessionStorage.removeItem(key);
  }, [key]);

  return { clearDraft };
}
