'use client';

import { useEffect, useRef } from 'react';
import { useMotionValue, useTransform, animate, motion } from 'framer-motion';
import { useMotionPreference, MOTION_DURATION } from '@/lib/motion';
import { cn } from '@/lib/utils';

const formatter = new Intl.NumberFormat('es-AR');

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  className?: string;
  prefix?: string;
}

export function AnimatedNumber({
  value,
  duration = MOTION_DURATION.slow,
  className,
  prefix,
}: AnimatedNumberProps) {
  const { shouldAnimate } = useMotionPreference();
  const motionValue = useMotionValue(0);
  const display = useTransform(motionValue, (v) => formatter.format(Math.round(v)));
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!shouldAnimate) {
      motionValue.set(value);
      return;
    }
    const controls = animate(motionValue, value, { duration, ease: 'easeOut' });
    return () => controls.stop();
  }, [value, duration, shouldAnimate, motionValue]);

  return (
    <span className={cn(className)}>
      {prefix}
      <motion.span ref={ref}>{display}</motion.span>
    </span>
  );
}
