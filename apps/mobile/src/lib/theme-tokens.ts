import {
  DESIGN_TOKENS_DARK,
  DESIGN_TOKENS_LIGHT,
  TASK_TYPE_TOKENS_DARK,
  TASK_TYPE_TOKENS_LIGHT,
} from '@epde/shared';
import { vars } from 'nativewind';

/**
 * NativeWind v5 + Tailwind v4 resolves CSS variables at build time,
 * so `.dark { --color-*: ... }` in global.css doesn't work at runtime.
 * Instead, we use `vars()` to inject CSS custom properties into the root
 * View's style, which NativeWind propagates to all children.
 *
 * Tokens are generated from `@epde/shared` DESIGN_TOKENS + TASK_TYPE_TOKENS,
 * eliminating the possibility of color drift between platforms.
 */

/**
 * Converts a token object to NativeWind `vars()` input with `--color-*` keys.
 * camelCase keys become kebab-case: `primaryForeground` → `--color-primary-foreground`
 */
function toVarsInput(
  tokens: Record<string, string>,
  prefix = '',
): Record<`--color-${string}`, string> {
  const result: Record<`--color-${string}`, string> = {};
  for (const [key, value] of Object.entries(tokens)) {
    const kebab = key.replace(/([A-Z])/g, '-$1').toLowerCase();
    const varName: `--color-${string}` = `--color-${prefix}${kebab}`;
    result[varName] = value;
  }
  return result;
}

export const lightTheme = vars({
  ...toVarsInput(DESIGN_TOKENS_LIGHT),
  ...toVarsInput(TASK_TYPE_TOKENS_LIGHT, 'task-'),
});

export const darkTheme = vars({
  ...toVarsInput(DESIGN_TOKENS_DARK),
  ...toVarsInput(TASK_TYPE_TOKENS_DARK, 'task-'),
});
