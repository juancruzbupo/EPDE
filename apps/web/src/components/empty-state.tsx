'use client';

import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  message: string;
  /**
   * CTA contextual. Visible cuando el estado vacío corresponde a un rol
   * que puede accionar (ej. cliente sin propiedades → "Pedir diagnóstico").
   * Cuando la lista está vacía por un filtro aplicado, preferir omitir
   * action y mostrar solo message con "probá otros criterios".
   */
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  message,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-24 text-center', className)}>
      <Icon className="text-muted-foreground/60 mb-4 h-12 w-12" aria-hidden="true" />
      <h2 className="text-muted-foreground text-lg font-medium">{title}</h2>
      <p className="text-muted-foreground/70 mt-1 max-w-sm text-sm">{message}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
