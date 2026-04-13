'use client';

import { QUERY_KEYS } from '@epde/shared';
import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';

import { Card, CardContent } from './ui/card';

interface WeeklyChallenge {
  type: string;
  target: number;
  progress: number;
  completed: boolean;
}

export function WeeklyChallengeCard() {
  const { data: challenge } = useQuery({
    queryKey: [QUERY_KEYS.dashboard, 'weekly-challenge'],
    queryFn: async ({ signal }) => {
      const { data } = await apiClient.get<{ data: WeeklyChallenge | null }>(
        '/dashboard/weekly-challenge',
        { signal },
      );
      return data.data;
    },
    staleTime: 5 * 60_000,
  });

  // Only show when completed — avoids duplicating the pending tasks list above.
  // The dopamine hit comes from the "completaste" feedback, not from restating pending work.
  if (!challenge || !challenge.completed) return null;

  return (
    <Card className="border-success/30 bg-success/5 mb-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">🎯 ¡Desafío completado!</p>
          <span className="text-muted-foreground text-xs font-medium">
            {challenge.target} de {challenge.target}
          </span>
        </div>
        <p className="text-muted-foreground mt-1 text-xs">
          Completaste el desafío de esta semana. ¡Seguí así!
        </p>
        <div className="bg-muted mt-2 h-2 overflow-hidden rounded-full">
          <div className="bg-success h-full w-full rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}
