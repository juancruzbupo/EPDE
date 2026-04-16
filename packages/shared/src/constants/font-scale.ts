/**
 * User-adjustable font scale tier. Multiplier applied on top of the base
 * typography tokens of each platform:
 *
 *   Web: `--font-scale` CSS variable on `<html>`, consumed by `type-*`
 *        utility classes (see apps/web/src/app/globals.css).
 *   Mobile: `useType()` hook wraps `TYPE` style objects so
 *        fontSize + lineHeight are multiplied at read time.
 *
 * Single source of truth for both platforms so tier values can't drift.
 * If you change the multipliers here, both web and mobile pick them up on
 * next build.
 */
export type FontScale = 'sm' | 'base' | 'lg' | 'xl';

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

export function isFontScale(value: unknown): value is FontScale {
  return value === 'sm' || value === 'base' || value === 'lg' || value === 'xl';
}
