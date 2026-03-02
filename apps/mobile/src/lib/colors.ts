/**
 * Design tokens as JS constants.
 * Mirrors the CSS theme in global.css for use in JS-only APIs
 * (navigation headers, ActivityIndicator, StyleSheet, etc.).
 */
export const colors = {
  primary: '#c4704b',
  primaryForeground: '#ffffff',
  secondary: '#e8ddd3',
  secondaryForeground: '#2e2a27',
  background: '#fafaf8',
  foreground: '#2e2a27',
  card: '#ffffff',
  cardForeground: '#2e2a27',
  muted: '#f5f0eb',
  mutedForeground: '#4a4542',
  destructive: '#c45b4b',
  destructiveForeground: '#ffffff',
  border: '#e8ddd3',
  input: '#e8ddd3',
  ring: '#c4704b',
  success: '#6b9b7a',
  warning: '#d4a843',
} as const;
