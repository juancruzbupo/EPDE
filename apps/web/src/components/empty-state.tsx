'use client';

import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';

import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  message: string;
  className?: string;
}

export function EmptyState({ icon: Icon = Inbox, title, message, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-24 text-center', className)}>
      <Icon className="text-muted-foreground/40 mb-4 h-12 w-12" />
      <h2 className="text-muted-foreground text-lg font-medium">{title}</h2>
      <p className="text-muted-foreground/70 mt-1 max-w-sm text-sm">{message}</p>
    </div>
  );
}
