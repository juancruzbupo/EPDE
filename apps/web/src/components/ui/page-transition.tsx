'use client';

import { motion } from 'framer-motion';
import { Children, type ReactNode } from 'react';

import { STAGGER_CONTAINER, STAGGER_ITEM, useMotionPreference } from '@/lib/motion';
import { cn } from '@/lib/utils';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  const { shouldAnimate } = useMotionPreference();

  if (!shouldAnimate) {
    return <div className={cn('space-y-6', className)}>{children}</div>;
  }

  return (
    <motion.div
      className={cn('space-y-6', className)}
      variants={STAGGER_CONTAINER}
      initial="hidden"
      animate="visible"
    >
      {Children.map(children, (child) =>
        child ? <motion.div variants={STAGGER_ITEM}>{child}</motion.div> : null,
      )}
    </motion.div>
  );
}
