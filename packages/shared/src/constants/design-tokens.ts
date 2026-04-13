/**
 * EPDE Design Tokens — Single Source of Truth for brand colors.
 *
 * These values are consumed by:
 *   - `apps/mobile/src/lib/colors.ts`       (React Native — imports these tokens directly)
 *   - `apps/web/src/app/globals.css`         (CSS custom properties — synced via css-tokens.test.ts)
 *   - `apps/mobile/src/app/global.css`       (Expo DOM — synced via css-tokens.test.ts)
 *
 * When updating a color, update it here first, then propagate to CSS files.
 * The `css-tokens.test.ts` suite will catch any drift between JS tokens and CSS variables.
 *
 * Note: `sidebar-*` and `popover-*` CSS tokens in globals.css are web-only "app chrome"
 * variables managed by shadcn/ui. They are NOT part of the shared brand palette and
 * intentionally omitted from these token objects.
 */

/** Light mode (default) palette */
export const DESIGN_TOKENS_LIGHT = {
  primary: '#a65636',
  primaryForeground: '#ffffff',
  secondary: '#e8ddd3',
  secondaryForeground: '#2e2a27',
  background: '#fafaf8',
  foreground: '#2e2a27',
  card: '#ffffff',
  cardForeground: '#2e2a27',
  muted: '#f5f0eb',
  mutedForeground: '#3d3a37',
  accent: '#e8ddd3',
  accentForeground: '#2e2a27',
  destructive: '#b04a3a',
  destructiveForeground: '#ffffff',
  border: '#e8ddd3',
  input: '#e8ddd3',
  ring: '#a65636',
  // Semantic status colors
  success: '#4d7d5c',
  successForeground: '#ffffff',
  warning: '#7a6514',
  warningForeground: '#ffffff',
  caution: '#965018',
  cautionForeground: '#fafaf8',
  // Task status colors (semantic — used in task list/detail views)
  statusPending: '#924408',
  statusUpcoming: '#2563eb',
  statusCompleted: '#059669',
} as const;

/** Dark mode palette */
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
  mutedForeground: '#c9b8aa',
  accent: '#3d3835',
  accentForeground: '#f5f0eb',
  destructive: '#e5736a',
  destructiveForeground: '#1a1715',
  border: 'rgba(255, 255, 255, 0.15)',
  input: 'rgba(255, 255, 255, 0.2)',
  ring: '#d4956f',
  success: '#7ab588',
  successForeground: '#1a1715',
  warning: '#d4b050',
  warningForeground: '#1a1715',
  caution: '#d48050',
  cautionForeground: '#1a1715',
  statusPending: '#fbbf24',
  statusUpcoming: '#60a5fa',
  statusCompleted: '#34d399',
} as const;

export type DesignTokens = typeof DESIGN_TOKENS_LIGHT;

/** Task-type color tokens — light mode */
export const TASK_TYPE_TOKENS_LIGHT = {
  inspection: '#3b82f6',
  cleaning: '#06b6d4',
  test: '#6366f1',
  treatment: '#a855f7',
  sealing: '#f59e0b',
  lubrication: '#84cc16',
  adjustment: '#64748b',
  measurement: '#14b8a6',
  evaluation: '#8b5cf6',
} as const;

/** Task-type color tokens — dark mode */
export const TASK_TYPE_TOKENS_DARK = {
  inspection: '#60a5fa',
  cleaning: '#22d3ee',
  test: '#818cf8',
  treatment: '#c084fc',
  sealing: '#fbbf24',
  lubrication: '#a3e635',
  adjustment: '#94a3b8',
  measurement: '#2dd4bf',
  evaluation: '#a78bfa',
} as const;

export type TaskTypeTokens = typeof TASK_TYPE_TOKENS_LIGHT;

/** Professional requirement color tokens — light mode */
export const PROFESSIONAL_REQ_TOKENS_LIGHT = {
  ownerCanDo: '#6b9b7a',
  professionalRecommended: '#c4a030',
  professionalRequired: '#a65636',
} as const;

/** Professional requirement color tokens — dark mode */
export const PROFESSIONAL_REQ_TOKENS_DARK = {
  ownerCanDo: '#7ab588',
  professionalRecommended: '#d4b050',
  professionalRequired: '#e5736a',
} as const;

export type ProfessionalReqTokens = typeof PROFESSIONAL_REQ_TOKENS_LIGHT;

/** Chart color tokens — light mode */
export const CHART_TOKENS_LIGHT = {
  chart1: '#a65636',
  chart2: '#6b9b7a',
  chart3: '#5b8ec4',
  chart4: '#d4a843',
  chart5: '#d4956f',
} as const;

/** Chart color tokens — dark mode */
export const CHART_TOKENS_DARK = {
  chart1: '#d4956f',
  chart2: '#6b9b7a',
  chart3: '#5b8ec4',
  chart4: '#d4a843',
  chart5: '#a65636',
} as const;

export type ChartTokens = typeof CHART_TOKENS_LIGHT;

/**
 * Inspection guide color tokens — light mode.
 *
 * Used in the inspection UI (condition badges, guide highlights in web).
 * Propagated to: apps/web/src/app/globals.css (--guide-* vars in :root)
 *
 * NOT propagated to mobile CSS — the inspection module is web-only.
 * If mobile ever adds inspection views, extend apps/mobile/src/app/global.css
 * and apps/mobile/src/lib/colors.ts with these values.
 *
 * Each condition has three variants: text / background / border.
 */
export const INSPECTION_TOKENS_LIGHT = {
  guideOk: '#166534',
  guideOkBg: '#f0fdf4',
  guideOkBorder: '#bbf7d0',
  guideAttention: '#854d0e',
  guideAttentionBg: '#fefce8',
  guideAttentionBorder: '#fef08a',
  guideProfessional: '#991b1b',
  guideProfessionalBg: '#fef2f2',
  guideProfessionalBorder: '#fecaca',
  guideDanger: '#991b1b',
  guideDangerBg: '#fef2f2',
  guideDangerBorder: '#fecaca',
  guideWarning: '#92400e',
  guideWarningBg: '#fffbeb',
  guideWarningBorder: '#fde68a',
} as const;

/** Inspection guide color tokens — dark mode. */
export const INSPECTION_TOKENS_DARK = {
  guideOk: '#bbf7d0',
  guideOkBg: 'rgba(22, 101, 52, 0.3)',
  guideOkBorder: '#166534',
  guideAttention: '#fef08a',
  guideAttentionBg: 'rgba(133, 77, 14, 0.3)',
  guideAttentionBorder: '#854d0e',
  guideProfessional: '#fecaca',
  guideProfessionalBg: 'rgba(153, 27, 27, 0.3)',
  guideProfessionalBorder: '#991b1b',
  guideDanger: '#fecaca',
  guideDangerBg: 'rgba(153, 27, 27, 0.3)',
  guideDangerBorder: '#991b1b',
  guideWarning: '#fde68a',
  guideWarningBg: 'rgba(146, 64, 14, 0.3)',
  guideWarningBorder: '#92400e',
} as const;

export type InspectionTokens = typeof INSPECTION_TOKENS_LIGHT;
