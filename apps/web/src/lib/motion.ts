'use client';

import type { Variants } from 'framer-motion';
import { useReducedMotion } from 'framer-motion';

// --- Duration constants ---

export const MOTION_DURATION = {
  fast: 0.15,
  normal: 0.25,
  slow: 0.4,
} as const;

const EASE_OUT: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

// --- Variants ---

export const FADE_IN: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: MOTION_DURATION.normal, ease: EASE_OUT } },
};

export const FADE_IN_UP: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: MOTION_DURATION.slow, ease: EASE_OUT } },
};

export const SCALE_IN: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: MOTION_DURATION.normal, ease: EASE_OUT },
  },
};

export const SLIDE_IN_LEFT: Variants = {
  hidden: { opacity: 0, x: -16 },
  visible: { opacity: 1, x: 0, transition: { duration: MOTION_DURATION.normal, ease: EASE_OUT } },
};

export const SLIDE_IN_RIGHT: Variants = {
  hidden: { opacity: 0, x: 16 },
  visible: { opacity: 1, x: 0, transition: { duration: MOTION_DURATION.normal, ease: EASE_OUT } },
};

export const STAGGER_CONTAINER: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

export const STAGGER_ITEM: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: MOTION_DURATION.normal, ease: EASE_OUT } },
};

export const MICRO_BOUNCE: Variants = {
  tap: { scale: 0.95, transition: { duration: MOTION_DURATION.fast } },
};

export const PULSE_ONCE: Variants = {
  pulse: {
    scale: [1, 1.08, 1],
    transition: { duration: 0.3, ease: EASE_OUT },
  },
};

// --- Reduced motion ---

const EMPTY_VARIANTS: Variants = {
  hidden: {},
  visible: {},
};

export function useMotionPreference() {
  const shouldReduce = useReducedMotion();
  const shouldAnimate = !shouldReduce;

  return {
    shouldAnimate,
    variants: shouldAnimate ? STAGGER_ITEM : EMPTY_VARIANTS,
    containerVariants: shouldAnimate ? STAGGER_CONTAINER : EMPTY_VARIANTS,
  };
}
