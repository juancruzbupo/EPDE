'use client';

import { useReducedMotion } from 'framer-motion';
import type { Variants } from 'framer-motion';

// --- Duration constants ---

export const MOTION_DURATION = {
  fast: 0.15,
  normal: 0.25,
  slow: 0.4,
} as const;

const EASE_OUT: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

// --- Variants ---

export const fadeIn: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: MOTION_DURATION.normal, ease: EASE_OUT } },
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: MOTION_DURATION.slow, ease: EASE_OUT } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: MOTION_DURATION.normal, ease: EASE_OUT },
  },
};

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -16 },
  visible: { opacity: 1, x: 0, transition: { duration: MOTION_DURATION.normal, ease: EASE_OUT } },
};

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 16 },
  visible: { opacity: 1, x: 0, transition: { duration: MOTION_DURATION.normal, ease: EASE_OUT } },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: MOTION_DURATION.normal, ease: EASE_OUT } },
};

export const microBounce: Variants = {
  tap: { scale: 0.95, transition: { duration: MOTION_DURATION.fast } },
};

export const pulseOnce: Variants = {
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
    variants: shouldAnimate ? staggerItem : EMPTY_VARIANTS,
    containerVariants: shouldAnimate ? staggerContainer : EMPTY_VARIANTS,
  };
}
