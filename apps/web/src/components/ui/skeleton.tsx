import { useMotionPreference } from '@/lib/motion';
import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  const { shouldAnimate } = useMotionPreference();
  return (
    <div
      data-slot="skeleton"
      role="status"
      aria-busy="true"
      aria-label="Cargando..."
      className={cn(
        'bg-accent rounded-md',
        shouldAnimate ? 'skeleton-shimmer' : 'animate-pulse',
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
