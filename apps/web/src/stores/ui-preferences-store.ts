'use client';

import type { NotificationType } from '@epde/shared';
import { create } from 'zustand';

/**
 * User-adjustable UI preferences persisted to localStorage. Loaded at boot by a
 * beforeInteractive inline script in the root layout to prevent flash.
 */

export type FontScale = 'sm' | 'base' | 'lg' | 'xl';
/** rewards = confetti + motivational toasts + milestones/challenges; minimal = data-first, no celebrations. */
export type MotivationStyle = 'rewards' | 'minimal';

const FONT_SCALE_STORAGE_KEY = 'epde-font-scale';
const MOTIVATION_STYLE_STORAGE_KEY = 'epde-motivation-style';
const HIDDEN_NOTIFICATION_TYPES_KEY = 'epde-hidden-notification-types';

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
  motivationStyle: MotivationStyle;
  /** Notification types the user wants hidden from the in-app list/bell.
   *  This is UI-only — push/email delivery depends on the backend. */
  hiddenNotificationTypes: NotificationType[];
  setFontScale: (scale: FontScale) => void;
  setMotivationStyle: (style: MotivationStyle) => void;
  toggleHiddenNotificationType: (type: NotificationType) => void;
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

function loadMotivationStyle(): MotivationStyle {
  if (typeof window === 'undefined') return 'rewards';
  try {
    const stored = window.localStorage.getItem(MOTIVATION_STYLE_STORAGE_KEY);
    if (stored === 'rewards' || stored === 'minimal') return stored;
  } catch {
    // localStorage unavailable
  }
  return 'rewards';
}

const VALID_NOTIFICATION_TYPES = new Set([
  'TASK_REMINDER',
  'BUDGET_UPDATE',
  'SERVICE_UPDATE',
  'SYSTEM',
]);

function loadHiddenNotificationTypes(): NotificationType[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(HIDDEN_NOTIFICATION_TYPES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is NotificationType => VALID_NOTIFICATION_TYPES.has(v));
  } catch {
    return [];
  }
}

export const useUiPreferencesStore = create<UiPreferencesState>((set, get) => ({
  fontScale: loadFontScale(),
  motivationStyle: loadMotivationStyle(),
  hiddenNotificationTypes: loadHiddenNotificationTypes(),
  setFontScale: (scale) => {
    try {
      window.localStorage.setItem(FONT_SCALE_STORAGE_KEY, scale);
    } catch {
      // best-effort persistence
    }
    applyFontScaleToDocument(scale);
    set({ fontScale: scale });
  },
  setMotivationStyle: (style) => {
    try {
      window.localStorage.setItem(MOTIVATION_STYLE_STORAGE_KEY, style);
    } catch {
      // best-effort persistence
    }
    set({ motivationStyle: style });
  },
  toggleHiddenNotificationType: (type) => {
    const current = get().hiddenNotificationTypes;
    const next = current.includes(type) ? current.filter((t) => t !== type) : [...current, type];
    try {
      window.localStorage.setItem(HIDDEN_NOTIFICATION_TYPES_KEY, JSON.stringify(next));
    } catch {
      // best-effort persistence
    }
    set({ hiddenNotificationTypes: next });
  },
}));
