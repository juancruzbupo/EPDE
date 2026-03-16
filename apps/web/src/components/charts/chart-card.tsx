'use client';

import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SkeletonShimmer } from '@/components/ui/skeleton-shimmer';
import { FADE_IN_UP, useMotionPreference } from '@/lib/motion';

interface ChartCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyIcon?: React.ReactNode;
  emptyMessage?: string;
  height?: number;
  className?: string;
  action?: React.ReactNode;
  /** If provided, renders a drill-down link in the card header. */
  href?: string;
}

export function ChartCard({
  title,
  description,
  children,
  isLoading,
  isEmpty,
  emptyIcon,
  emptyMessage = 'Sin datos suficientes para mostrar esta métrica',
  height = 300,
  className,
  action,
  href,
}: ChartCardProps) {
  const { shouldAnimate } = useMotionPreference();
  const Wrapper = shouldAnimate ? motion.div : 'div';

  return (
    <Wrapper
      className={className}
      {...(shouldAnimate ? { variants: FADE_IN_UP, initial: 'hidden', animate: 'visible' } : {})}
    >
      <Card className="h-full">
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="type-title-md text-foreground">{title}</CardTitle>
            {description && (
              <p className="type-body-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {action}
            {href && (
              <Link
                href={href}
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs transition-colors"
              >
                Ver detalle
                <ExternalLink className="h-3 w-3" />
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <SkeletonShimmer style={{ height }} className="w-full" />
          ) : isEmpty ? (
            <div className="flex flex-col items-center justify-center gap-2" style={{ height }}>
              {emptyIcon && <div className="text-muted-foreground/50">{emptyIcon}</div>}
              <p className="type-body-sm text-muted-foreground text-center">{emptyMessage}</p>
            </div>
          ) : (
            children
          )}
        </CardContent>
      </Card>
    </Wrapper>
  );
}
