/**
 * Design tokens as JS constants for React Native.
 * Re-exports from @epde/shared so that the mobile app always uses
 * the canonical brand palette. Dark mode is web-only; mobile is always light.
 *
 * Use these constants for JS-only APIs (navigation headers, ActivityIndicator,
 * StyleSheet) where Tailwind/CSS custom properties are not available.
 */
import { DESIGN_TOKENS_LIGHT } from '@epde/shared';

export const COLORS = DESIGN_TOKENS_LIGHT;
