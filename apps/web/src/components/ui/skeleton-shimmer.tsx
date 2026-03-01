'use client';

import { useMotionPreference } from '@/lib/motion';
import { cn } from '@/lib/utils';

export function SkeletonShimmer({ className, ...props }: React.ComponentProps<'div'>) {
  const { shouldAnimate } = useMotionPreference();

  return (
    <div
      data-slot="skeleton"
      className={cn(
        'bg-accent rounded-md',
        shouldAnimate ? 'skeleton-shimmer' : 'animate-pulse',
        className,
      )}
      {...props}
    />
  );
}
