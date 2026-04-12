'use client';

import { MILESTONES } from '@epde/shared';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useMilestones } from '@/hooks/use-milestones';

export function MilestonesSection() {
  const { data: earned, isLoading } = useMilestones();
  const earnedTypes = new Set(earned?.map((m) => m.type) ?? []);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Logros</CardTitle>
        <CardDescription>Tus hitos de mantenimiento preventivo</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {MILESTONES.map((milestone) => {
            const isEarned = earnedTypes.has(milestone.type);
            const earnedData = earned?.find((m) => m.type === milestone.type);
            return (
              <div
                key={milestone.type}
                className={`rounded-xl border p-3 text-center transition-all ${
                  isEarned
                    ? 'border-primary/30 bg-primary/5'
                    : 'border-border bg-muted/30 opacity-50'
                }`}
              >
                <span className="text-2xl">{milestone.emoji}</span>
                <p className="mt-1 text-xs font-semibold">{milestone.label}</p>
                {isEarned && earnedData && (
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {new Date(earnedData.unlockedAt).toLocaleDateString('es-AR', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </p>
                )}
                {!isEarned && <p className="text-muted-foreground mt-0.5 text-xs">Pendiente</p>}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
