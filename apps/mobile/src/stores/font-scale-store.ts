import { FONT_SCALE_VALUES, type FontScale, isFontScale } from '@epde/shared';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

/**
 * Mobile font-scale preference. Mirrors `fontScale` in web's
 * `ui-preferences-store.ts` — same tiers (sm/base/lg/xl), same values
 * (0.9/1/1.15/1.3), sourced from `@epde/shared/constants/font-scale.ts`.
 *
 * Mobile applies the multiplier via `useType()` (see lib/fonts.ts) which
 * scales the `TYPE.*` style objects at read time. Web applies it via the
 * `--font-scale` CSS variable on `<html>`.
 *
 * Storage: AsyncStorage with key `epde-font-scale` (parity with web's
 * localStorage key for debuggability — same key means the same intent
 * across platforms, even though the backends differ).
 */

const FONT_SCALE_STORAGE_KEY = 'epde-font-scale';

interface FontScaleState {
  fontScale: FontScale;
  /** True once the persisted value was read from disk. Consumers that need
   * a stable first render (e.g. to avoid flashing a larger font and
   * snapping back) can gate UI on `hydrated`. */
  hydrated: boolean;
  setFontScale: (scale: FontScale) => void;
  loadSavedFontScale: () => Promise<void>;
}

export const useFontScaleStore = create<FontScaleState>((set) => ({
  fontScale: 'base',
  hydrated: false,
  setFontScale: (scale) => {
    set({ fontScale: scale });
    // Best-effort persistence — if AsyncStorage fails the in-memory state
    // still reflects the user's choice for the current session.
    AsyncStorage.setItem(FONT_SCALE_STORAGE_KEY, scale).catch(() => {});
  },
  loadSavedFontScale: async () => {
    try {
      const saved = await AsyncStorage.getItem(FONT_SCALE_STORAGE_KEY);
      if (isFontScale(saved)) {
        set({ fontScale: saved, hydrated: true });
        return;
      }
    } catch {
      // AsyncStorage unavailable — fall through to base.
    }
    set({ hydrated: true });
  },
}));

/** Multiplier for the currently active font scale. Mirrors FONT_SCALE_VALUES
 * lookup — re-exported for consumers that only need the number. */
export function useFontScaleMultiplier(): number {
  const scale = useFontScaleStore((s) => s.fontScale);
  return FONT_SCALE_VALUES[scale];
}
