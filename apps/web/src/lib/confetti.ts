import confetti from 'canvas-confetti';

/**
 * Fire a short confetti burst (0.8s). Used on task completion and milestone unlocks.
 * Safe to call multiple times — each burst is independent.
 */
export function triggerConfetti() {
  const end = Date.now() + 800;
  const colors = ['#C4704B', '#e8ddd3', '#4ade80', '#facc15', '#60a5fa'];

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
