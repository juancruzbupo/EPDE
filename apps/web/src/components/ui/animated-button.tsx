'use client';

import { motion } from 'framer-motion';
import { Button, type buttonVariants } from '@/components/ui/button';
import { useMotionPreference, MOTION_DURATION } from '@/lib/motion';
import type { VariantProps } from 'class-variance-authority';
import { forwardRef } from 'react';

type ButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export const AnimatedButton = forwardRef<HTMLButtonElement, ButtonProps>(function AnimatedButton(
  { variant, ...props },
  ref,
) {
  const { shouldAnimate } = useMotionPreference();

  if (!shouldAnimate) {
    return <Button ref={ref} variant={variant} {...props} />;
  }

  const isDestructive = variant === 'destructive';

  return (
    <motion.span
      className="inline-flex"
      whileTap={{ scale: 0.97, transition: { duration: MOTION_DURATION.fast } }}
      whileHover={
        isDestructive
          ? { x: [-1, 1, -1, 0], transition: { duration: 0.3, ease: 'easeInOut' } }
          : { scale: 1.02, transition: { duration: MOTION_DURATION.fast } }
      }
    >
      <Button ref={ref} variant={variant} {...props} />
    </motion.span>
  );
});
