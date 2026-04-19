import { FONT_SCALE_VALUES } from '@epde/shared';
import { useMemo } from 'react';
import { PixelRatio } from 'react-native';

import { useFontScaleStore } from '@/stores/font-scale-store';

/**
 * Tope máximo combinado (app × OS). Sin cap, un usuario con iOS Dynamic
 * Type al 150% + nuestro tier `xl` (1.3×) llega a ~2× y los cards
 * desbordan en 375px. 1.5× es el máximo aceptable para los layouts
 * actuales; más que eso requiere refactor responsive dedicado.
 */
const MAX_COMBINED_SCALE = 1.5;

function clampMultiplier(appMultiplier: number): number {
  // PixelRatio.getFontScale() refleja el setting del OS (iOS Display &
  // Brightness → Text Size, Android Accessibility → Font size). Lo
  // respetamos pero topado para no romper layouts.
  const osScale = PixelRatio.getFontScale();
  const combined = appMultiplier * osScale;
  return Math.min(combined, MAX_COMBINED_SCALE);
}

/**
 * Base typography tokens — unscaled (multiplier = 1).
 *
 * Consumers that want to respect the user's font-scale preference should
 * read `TYPE` via `useType()` (the hook below) rather than import this
 * object directly. Importing TYPE directly renders at base scale only,
 * which is the right default for screens that haven't been migrated yet.
 *
 * labelMd was bumped from 12→13 for legibility on aging eyes (Apple HIG
 * suggests 13pt as the floor for reading-grade text). labelSm stays at
 * 12 because it's reserved for chips/badges where a bump would distort
 * the round shape.
 */
export const TYPE = {
  // Headings (DM Serif Display)
  displayLg: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 28, lineHeight: 34 },
  displaySm: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 22, lineHeight: 28 },
  // Titles (DM Sans Bold)
  titleLg: { fontFamily: 'DMSans_700Bold', fontSize: 18, lineHeight: 24 },
  titleMd: { fontFamily: 'DMSans_700Bold', fontSize: 16, lineHeight: 22 },
  titleSm: { fontFamily: 'DMSans_700Bold', fontSize: 14, lineHeight: 20 },
  // Body (DM Sans Regular)
  bodyLg: { fontFamily: 'DMSans_400Regular', fontSize: 16, lineHeight: 22 },
  bodyMd: { fontFamily: 'DMSans_400Regular', fontSize: 14, lineHeight: 20 },
  bodySm: { fontFamily: 'DMSans_400Regular', fontSize: 13, lineHeight: 18 },
  // Labels (DM Sans Medium)
  labelLg: { fontFamily: 'DMSans_500Medium', fontSize: 14, lineHeight: 20 },
  labelMd: { fontFamily: 'DMSans_500Medium', fontSize: 13, lineHeight: 18 },
  labelSm: { fontFamily: 'DMSans_500Medium', fontSize: 12, lineHeight: 16 },
  // Numbers (DM Sans Bold — stat cards, prices)
  numberLg: { fontFamily: 'DMSans_700Bold', fontSize: 24, lineHeight: 30 },
  numberMd: { fontFamily: 'DMSans_700Bold', fontSize: 18, lineHeight: 24 },
} as const;

export type TypeStyle = (typeof TYPE)[keyof typeof TYPE];

/**
 * Returns `TYPE` with fontSize + lineHeight multiplied by the user's
 * current font scale (sm/base/lg/xl — see shared FONT_SCALE_VALUES).
 * Labels (labelSm) still scale — nothing is pinned at a lower size.
 *
 * Use this in screens where accessibility matters: dashboards, action
 * lists, detail views. Profile page uses this for its preview swatch
 * so users see the effect live.
 *
 * Migration pattern:
 *   import { TYPE } from '@/lib/fonts'  →  const TYPE = useType();
 * The shape is identical, so existing `style={TYPE.bodyMd}` call sites
 * work unchanged.
 */
export function useType(): typeof TYPE {
  const scale = useFontScaleStore((s) => s.fontScale);
  return useMemo(() => {
    const appMultiplier = FONT_SCALE_VALUES[scale];
    const multiplier = clampMultiplier(appMultiplier);
    if (multiplier === 1) return TYPE;
    // Use a plain object literal so the return type still satisfies `typeof TYPE`.
    return Object.fromEntries(
      Object.entries(TYPE).map(([key, style]) => [
        key,
        {
          ...style,
          fontSize: Math.round(style.fontSize * multiplier),
          lineHeight: Math.round(style.lineHeight * multiplier),
        },
      ]),
    ) as typeof TYPE;
  }, [scale]);
}

/**
 * Pure helper — scale a single TYPE style by the current font scale.
 * Use when you need a one-off scaled value (e.g. for dynamic sizes in
 * charts) without pulling the whole `useType()` object.
 */
export function useScaledStyle<S extends TypeStyle>(style: S): S {
  const scale = useFontScaleStore((s) => s.fontScale);
  return useMemo(() => {
    const multiplier = clampMultiplier(FONT_SCALE_VALUES[scale]);
    if (multiplier === 1) return style;
    return {
      ...style,
      fontSize: Math.round(style.fontSize * multiplier),
      lineHeight: Math.round(style.lineHeight * multiplier),
    };
  }, [scale, style]);
}
