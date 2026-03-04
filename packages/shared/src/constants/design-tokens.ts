/**
 * EPDE Design Tokens — Single Source of Truth for brand colors.
 *
 * These values are consumed by:
 *   - `apps/mobile/src/lib/colors.ts`       (React Native, JS-only APIs)
 *   - `apps/web/src/app/globals.css`         (CSS custom properties — keep in sync manually)
 *   - `apps/mobile/src/app/global.css`       (Expo DOM, keep in sync manually)
 *
 * When updating a color, update it here first, then propagate to CSS files.
 */

/** Light mode (default) palette */
export const DESIGN_TOKENS_LIGHT = {
  primary: '#c4704b',
  primaryForeground: '#fafaf8',
  secondary: '#e8ddd3',
  secondaryForeground: '#2e2a27',
  background: '#fafaf8',
  foreground: '#2e2a27',
  card: '#ffffff',
  cardForeground: '#2e2a27',
  muted: '#f5f0eb',
  mutedForeground: '#4a4542',
  accent: '#e8ddd3',
  accentForeground: '#2e2a27',
  destructive: '#c45b4b',
  destructiveForeground: '#ffffff',
  border: '#e8ddd3',
  input: '#e8ddd3',
  ring: '#c4704b',
  // Semantic status colors
  success: '#6b9b7a',
  successForeground: '#1a1715',
  warning: '#c4a030',
  warningForeground: '#1a1715',
  caution: '#c47030',
  cautionForeground: '#fafaf8',
} as const;

/** Dark mode palette (web only — React Native uses light mode) */
export const DESIGN_TOKENS_DARK = {
  primary: '#d4956f',
  primaryForeground: '#1a1715',
  secondary: '#3d3835',
  secondaryForeground: '#f5f0eb',
  background: '#1a1715',
  foreground: '#f5f0eb',
  card: '#2e2a27',
  cardForeground: '#f5f0eb',
  muted: '#3d3835',
  mutedForeground: '#a09890',
  accent: '#3d3835',
  accentForeground: '#f5f0eb',
  destructive: '#c45b4b',
  destructiveForeground: '#ffffff',
  border: 'rgba(255, 255, 255, 0.1)',
  input: 'rgba(255, 255, 255, 0.15)',
  ring: '#d4956f',
  success: '#7ab588',
  successForeground: '#1a1715',
  warning: '#d4b050',
  warningForeground: '#1a1715',
  caution: '#d48050',
  cautionForeground: '#1a1715',
} as const;

export type DesignTokens = typeof DESIGN_TOKENS_LIGHT;
