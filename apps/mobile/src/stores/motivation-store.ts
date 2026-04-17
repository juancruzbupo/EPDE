import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

/**
 * Motivation style preference for mobile. Mirrors web's
 * `ui-preferences-store.ts` motivationStyle field.
 *
 * `rewards` = confetti + motivational toasts + weekly challenges visible.
 * `minimal` = data-first, neutral confirmations, no celebrations.
 *
 * Storage key matches web (`epde-motivation-style`) for parity in debug.
 * The values themselves are NOT synced cross-platform — each device stores
 * independently. If cross-platform sync is needed later, move to the
 * backend user preferences table.
 */

export type MotivationStyle = 'rewards' | 'minimal';

const MOTIVATION_STYLE_KEY = 'epde-motivation-style';

interface MotivationState {
  motivationStyle: MotivationStyle;
  hydrated: boolean;
  setMotivationStyle: (style: MotivationStyle) => void;
  loadSavedMotivationStyle: () => Promise<void>;
}

export const useMotivationStore = create<MotivationState>((set) => ({
  motivationStyle: 'rewards',
  hydrated: false,
  setMotivationStyle: (style) => {
    set({ motivationStyle: style });
    AsyncStorage.setItem(MOTIVATION_STYLE_KEY, style).catch(() => {});
  },
  loadSavedMotivationStyle: async () => {
    try {
      const saved = await AsyncStorage.getItem(MOTIVATION_STYLE_KEY);
      if (saved === 'rewards' || saved === 'minimal') {
        set({ motivationStyle: saved, hydrated: true });
        return;
      }
    } catch {
      // fall through
    }
    set({ hydrated: true });
  },
}));

export function useShowMotivation(): boolean {
  return useMotivationStore((s) => s.motivationStyle === 'rewards');
}
