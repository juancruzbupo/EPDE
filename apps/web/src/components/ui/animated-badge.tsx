'use client';

import { useEffect, useRef } from 'react';
import { motion, useAnimationControls } from 'framer-motion';
import { Badge, type badgeVariants } from '@/components/ui/badge';
import { useMotionPreference } from '@/lib/motion';
import type { VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

type BadgeProps = React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & {
    asChild?: boolean;
    pulse?: boolean;
    urgentPulse?: boolean;
  };

export function AnimatedBadge({
  children,
  pulse,
  urgentPulse,
  className,
  variant,
  ...props
}: BadgeProps) {
  const { shouldAnimate } = useMotionPreference();
  const controls = useAnimationControls();
  const prevChildren = useRef(children);

  useEffect(() => {
    if (!shouldAnimate) return;
    if (prevChildren.current !== children && pulse !== false) {
      controls.start({
        scale: [1, 1.08, 1],
        transition: { duration: 0.3 },
      });
    }
    prevChildren.current = children;
  }, [children, shouldAnimate, controls, pulse]);

  if (!shouldAnimate) {
    return (
      <Badge variant={variant} className={className} {...props}>
        {children}
      </Badge>
    );
  }

  return (
    <motion.span
      animate={
        urgentPulse
          ? {
              opacity: [1, 0.7, 1],
              transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
            }
          : controls
      }
      className={cn('inline-flex', urgentPulse && 'will-change-transform')}
      style={{ display: 'inline-flex' }}
    >
      <Badge variant={variant} className={className} {...props}>
        {children}
      </Badge>
    </motion.span>
  );
}
