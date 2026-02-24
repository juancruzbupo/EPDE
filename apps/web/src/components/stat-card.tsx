import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  description?: string;
  className?: string;
}

export function StatCard({ title, value, icon: Icon, description, className }: StatCardProps) {
  return (
    <Card className={cn(className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm font-medium">{title}</p>
            <p className="mt-1 text-3xl font-bold">{value}</p>
            {description && <p className="text-muted-foreground mt-1 text-xs">{description}</p>}
          </div>
          <div className="bg-primary/10 rounded-full p-3">
            <Icon className="text-primary h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
