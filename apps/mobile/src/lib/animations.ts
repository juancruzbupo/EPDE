import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';

// --- Timing constants ---

export const TIMING = {
  fast: 150,
  normal: 250,
  slow: 400,
} as const;

export const SPRING = {
  gentle: { damping: 15, stiffness: 150, mass: 0.5 },
  bouncy: { damping: 12, stiffness: 200, mass: 0.4 },
  stiff: { damping: 20, stiffness: 300, mass: 0.3 },
} as const;

// --- Reduced motion ---

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduced);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => sub.remove();
  }, []);

  return reduced;
}

// --- Entry animation ---

export function useAnimatedEntry(delay = 0) {
  const reduced = useReducedMotion();
  const opacity = useSharedValue(reduced ? 1 : 0);
  const translateY = useSharedValue(reduced ? 0 : 12);

  useEffect(() => {
    if (reduced) return;
    const timeout = setTimeout(() => {
      opacity.value = withTiming(1, { duration: TIMING.normal, easing: Easing.out(Easing.quad) });
      translateY.value = withTiming(0, {
        duration: TIMING.normal,
        easing: Easing.out(Easing.quad),
      });
    }, delay);
    return () => clearTimeout(timeout);
  }, [delay, reduced, opacity, translateY]);

  return useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));
}

// --- Staggered list ---

export function useStaggeredList(_itemCount: number) {
  const reduced = useReducedMotion();

  return {
    getItemDelay: (index: number) => (reduced ? 0 : index * 50),
  };
}

// --- Press animation ---

export function usePressAnimation() {
  const scale = useSharedValue(1);
  const reduced = useReducedMotion();

  const onPressIn = () => {
    if (reduced) return;
    scale.value = withSpring(0.97, SPRING.bouncy);
  };

  const onPressOut = () => {
    if (reduced) return;
    scale.value = withSpring(1, SPRING.gentle);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return { animatedStyle, onPressIn, onPressOut };
}

// --- Count up ---

export function useCountUp(targetValue: number, duration = TIMING.slow) {
  const reduced = useReducedMotion();
  const value = useSharedValue(reduced ? targetValue : 0);

  useEffect(() => {
    if (reduced) {
      value.value = targetValue;
      return;
    }
    value.value = withTiming(targetValue, {
      duration,
      easing: Easing.out(Easing.quad),
    });
  }, [targetValue, duration, reduced, value]);

  return value;
}

// --- Pulse ---

export function usePulse(active = true) {
  const reduced = useReducedMotion();
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (reduced || !active) {
      opacity.value = 1;
      return;
    }
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 800, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, [active, reduced, opacity]);

  return useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));
}

// --- Slide in ---

export function useSlideIn(direction: 'left' | 'right' | 'bottom' = 'bottom') {
  const reduced = useReducedMotion();
  const offset = useSharedValue(
    reduced ? 0 : direction === 'bottom' ? 100 : direction === 'right' ? 50 : -50,
  );
  const opacity = useSharedValue(reduced ? 1 : 0);

  useEffect(() => {
    if (reduced) return;
    opacity.value = withTiming(1, { duration: TIMING.normal });
    offset.value = withSpring(0, SPRING.gentle);
  }, [reduced, opacity, offset]);

  return useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      direction === 'bottom' ? { translateY: offset.value } : { translateX: offset.value },
    ],
  }));
}
