import { useEffect, useState, useCallback } from 'react';
import { Text, type TextProps } from 'react-native';
import {
  useSharedValue,
  useAnimatedReaction,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { useReducedMotion, TIMING } from '@/lib/animations';

interface AnimatedNumberProps extends Omit<TextProps, 'children'> {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  formatOptions?: Intl.NumberFormatOptions;
}

const defaultFormat: Intl.NumberFormatOptions = {
  maximumFractionDigits: 0,
};

export function AnimatedNumber({
  value,
  duration = TIMING.slow,
  prefix = '',
  suffix = '',
  formatOptions = defaultFormat,
  ...textProps
}: AnimatedNumberProps) {
  const reduced = useReducedMotion();
  const animatedValue = useSharedValue(reduced ? value : 0);

  const format = useCallback(
    (v: number) => new Intl.NumberFormat('es-AR', formatOptions).format(Math.round(v)),
    [formatOptions],
  );

  const [display, setDisplay] = useState(() => `${prefix}${format(reduced ? value : 0)}${suffix}`);

  useEffect(() => {
    if (reduced) {
      animatedValue.value = value;
      setDisplay(`${prefix}${format(value)}${suffix}`);
      return;
    }
    animatedValue.value = withTiming(value, {
      duration,
      easing: Easing.out(Easing.quad),
    });
  }, [value, duration, reduced, animatedValue, prefix, suffix, format]);

  useAnimatedReaction(
    () => Math.round(animatedValue.value),
    (current, previous) => {
      if (current !== previous) {
        runOnJS(setDisplay)(
          `${prefix}${new Intl.NumberFormat('es-AR', formatOptions).format(current)}${suffix}`,
        );
      }
    },
    [prefix, suffix, formatOptions],
  );

  return <Text {...textProps}>{display}</Text>;
}
