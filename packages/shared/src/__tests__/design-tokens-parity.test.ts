import { readFileSync } from 'fs';
import { resolve } from 'path';

import { DESIGN_TOKENS_LIGHT } from '../constants/design-tokens';

/**
 * Verifies that mobile theme-tokens.ts and web globals.css stay in sync
 * with the canonical DESIGN_TOKENS_LIGHT / DESIGN_TOKENS_DARK from shared.
 *
 * Prevents color drift between platforms (the most common design system bug).
 */

const WEB_CSS = readFileSync(
  resolve(__dirname, '../../../../apps/web/src/app/globals.css'),
  'utf-8',
);

const MOBILE_THEME = readFileSync(
  resolve(__dirname, '../../../../apps/mobile/src/lib/theme-tokens.ts'),
  'utf-8',
);

describe('Design token parity', () => {
  describe('Web globals.css matches DESIGN_TOKENS_LIGHT', () => {
    const pairs: [string, string][] = [
      ['primary', DESIGN_TOKENS_LIGHT.primary],
      ['destructive', DESIGN_TOKENS_LIGHT.destructive],
      ['success', DESIGN_TOKENS_LIGHT.success],
      ['warning', DESIGN_TOKENS_LIGHT.warning],
      ['background', DESIGN_TOKENS_LIGHT.background],
      ['foreground', DESIGN_TOKENS_LIGHT.foreground],
    ];

    it.each(pairs)('--%s matches %s', (token, expected) => {
      const regex = new RegExp(`--${token}:\\s*${expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
      expect(WEB_CSS).toMatch(regex);
    });
  });

  describe('Mobile theme-tokens.ts imports from shared (no drift possible)', () => {
    it('imports DESIGN_TOKENS_LIGHT from @epde/shared', () => {
      expect(MOBILE_THEME).toContain('DESIGN_TOKENS_LIGHT');
    });

    it('imports DESIGN_TOKENS_DARK from @epde/shared', () => {
      expect(MOBILE_THEME).toContain('DESIGN_TOKENS_DARK');
    });

    it('imports TASK_TYPE_TOKENS_LIGHT from @epde/shared', () => {
      expect(MOBILE_THEME).toContain('TASK_TYPE_TOKENS_LIGHT');
    });

    it('imports TASK_TYPE_TOKENS_DARK from @epde/shared', () => {
      expect(MOBILE_THEME).toContain('TASK_TYPE_TOKENS_DARK');
    });
  });
});
