import { cn } from '@/lib/utils';

/**
 * Skeleton uses CSS shimmer by default. Falls back to animate-pulse
 * when prefers-reduced-motion is enabled (handled in globals.css).
 * This component is server-component safe (no hooks).
 */
function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      role="status"
      aria-busy="true"
      aria-label="Cargando..."
      className={cn('bg-accent skeleton-shimmer rounded-md', className)}
      {...props}
    />
  );
}

export { Skeleton };
