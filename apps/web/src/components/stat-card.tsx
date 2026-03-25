import { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: ReactNode;
  icon: LucideIcon;
  description?: string;
  className?: string;
}

export function StatCard({ title, value, icon: Icon, description, className }: StatCardProps) {
  return (
    <Card className={cn('h-full', className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="type-label-lg text-muted-foreground truncate">{title}</p>
            <p className="type-number-lg mt-1">{value}</p>
            {description && (
              <p className="type-body-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          <div className="bg-primary/10 rounded-full p-3">
            <Icon className="text-primary h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
