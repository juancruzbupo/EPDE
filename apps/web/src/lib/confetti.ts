import { DESIGN_TOKENS_LIGHT } from '@epde/shared';
import confetti from 'canvas-confetti';

/**
 * Fire a short confetti burst (0.8s). Used on task completion and milestone unlocks.
 * Safe to call multiple times — each burst is independent.
 *
 * No-ops when the user has requested reduced motion via the OS
 * (prefers-reduced-motion media query). Callers that already gate on a
 * user-level "motivation" preference still get the OS gate for free.
 */
export function triggerConfetti() {
  if (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  ) {
    return;
  }

  const end = Date.now() + 800;
  const colors = [
    DESIGN_TOKENS_LIGHT.primary,
    DESIGN_TOKENS_LIGHT.secondary,
    '#4ade80',
    '#facc15',
    '#60a5fa',
  ];

  (function frame() {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors,
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}
