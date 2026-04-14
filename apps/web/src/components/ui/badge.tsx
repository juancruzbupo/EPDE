import { BADGE_VARIANT_CLASSES, type BadgeVariant } from '@epde/shared';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * The per-variant Tailwind classes live in `@epde/shared/constants/badge-variants`
 * so web and mobile share a single source of truth (see that file's JSDoc for
 * the exhaustiveness guarantee). Web layers extra interactive affordances
 * (hover, focus-visible, anchor-hover, aria-invalid) on top of the shared
 * tokens inside this CVA — those are web-only and don't belong in shared.
 */
function variantClasses(v: BadgeVariant): string {
  const { bg, text, border } = BADGE_VARIANT_CLASSES[v];
  switch (v) {
    case 'default':
      return cn(bg, text, '[a&]:hover:bg-primary/90');
    case 'secondary':
      return cn(bg, text, '[a&]:hover:bg-secondary/90');
    case 'destructive':
      return cn(bg, text, '[a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20');
    case 'outline':
      return cn(bg, text, border, '[a&]:hover:bg-accent [a&]:hover:text-accent-foreground');
    case 'success':
      return cn(bg, text, border, '[a&]:hover:bg-success/25');
    case 'warning':
      return cn(bg, text, border, '[a&]:hover:bg-warning/25');
    case 'caution':
      return cn(bg, text, border, '[a&]:hover:bg-caution/25');
  }
}

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-full border border-transparent px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring focus-visible:ring-[3px] aria-invalid:ring-destructive/20 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden',
  {
    variants: {
      variant: {
        default: variantClasses('default'),
        secondary: variantClasses('secondary'),
        destructive: variantClasses('destructive'),
        outline: variantClasses('outline'),
        success: variantClasses('success'),
        warning: variantClasses('warning'),
        caution: variantClasses('caution'),
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

function Badge({
  className,
  variant = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'span';

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
