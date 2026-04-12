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

const CHALLENGE_LABELS: Record<string, string> = {
  CATCH_UP: 'Ponete al día',
  COMPLETE_N: 'Completá tareas',
  REVIEW: 'Revisá tu plan',
};

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

  if (!challenge) return null;

  const percentage = Math.min(100, Math.round((challenge.progress / challenge.target) * 100));
  const label = CHALLENGE_LABELS[challenge.type] ?? 'Desafío semanal';

  return (
    <Card
      className={`mb-4 ${challenge.completed ? 'border-success/30 bg-success/5' : 'border-primary/20 bg-primary/[0.03]'}`}
    >
      <CardContent className="p-4">
        <div className="mb-1 flex items-center justify-between">
          <p className="text-sm font-semibold">
            🎯 {challenge.completed ? '¡Desafío completado!' : label}
          </p>
          <span className="text-muted-foreground text-xs">
            {challenge.progress}/{challenge.target}
          </span>
        </div>
        <p className="text-muted-foreground mb-2 text-xs">
          {challenge.completed
            ? 'Completaste el desafío de esta semana. ¡Seguí así!'
            : 'Cada semana te proponemos un mini-objetivo para mantener tu casa al día.'}
        </p>
        <div className="bg-muted h-2 overflow-hidden rounded-full">
          <div
            className={`h-full rounded-full transition-all duration-500 ${challenge.completed ? 'bg-success' : 'bg-primary'}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
