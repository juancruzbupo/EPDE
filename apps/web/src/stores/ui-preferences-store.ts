'use client';

import { create } from 'zustand';

/**
 * User-adjustable UI preferences persisted to localStorage. Loaded at boot by a
 * beforeInteractive inline script in the root layout to prevent flash.
 */

export type FontScale = 'sm' | 'base' | 'lg' | 'xl';

const FONT_SCALE_STORAGE_KEY = 'epde-font-scale';

export const FONT_SCALE_VALUES: Record<FontScale, number> = {
  sm: 0.9, // denser — power users / Gen Z
  base: 1, // default
  lg: 1.15, // slight boost — helps Gen X presbyopia
  xl: 1.3, // large — Boomer and Silent Gen friendly
};

export const FONT_SCALE_LABELS: Record<FontScale, string> = {
  sm: 'Compacto',
  base: 'Normal',
  lg: 'Grande',
  xl: 'Extra grande',
};

interface UiPreferencesState {
  fontScale: FontScale;
  setFontScale: (scale: FontScale) => void;
}

function applyFontScaleToDocument(scale: FontScale): void {
  if (typeof document === 'undefined') return;
  document.documentElement.style.setProperty('--font-scale', String(FONT_SCALE_VALUES[scale]));
}

function loadFontScale(): FontScale {
  if (typeof window === 'undefined') return 'base';
  try {
    const stored = window.localStorage.getItem(FONT_SCALE_STORAGE_KEY);
    if (stored === 'sm' || stored === 'base' || stored === 'lg' || stored === 'xl') {
      return stored;
    }
  } catch {
    // localStorage unavailable
  }
  return 'base';
}

export const useUiPreferencesStore = create<UiPreferencesState>((set) => ({
  fontScale: loadFontScale(),
  setFontScale: (scale) => {
    try {
      window.localStorage.setItem(FONT_SCALE_STORAGE_KEY, scale);
    } catch {
      // best-effort persistence
    }
    applyFontScaleToDocument(scale);
    set({ fontScale: scale });
  },
}));
