import { type PropsWithChildren, useEffect, useRef } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { TIMING, useReducedMotion } from '@/lib/animations';

interface AnimatedBadgeProps {
  pulse?: boolean;
  urgentPulse?: boolean;
}

export function AnimatedBadge({
  children,
  pulse = false,
  urgentPulse = false,
}: PropsWithChildren<AnimatedBadgeProps>) {
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const mountedRef = useRef(false);

  // Pulse once on content change (skip first mount)
  useEffect(() => {
    if (reduced || !pulse) return;
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    scale.value = withSequence(
      withTiming(1.12, { duration: TIMING.fast, easing: Easing.out(Easing.quad) }),
      withTiming(1, { duration: TIMING.fast, easing: Easing.inOut(Easing.quad) }),
    );
  }, [children, pulse, reduced, scale]);

  // Continuous urgent pulse
  useEffect(() => {
    if (reduced || !urgentPulse) {
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
  }, [urgentPulse, reduced, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (reduced && !urgentPulse) {
    return <>{children}</>;
  }

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
}
