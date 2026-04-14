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

function challengeDescription(type: string, target: number): string {
  if (type === 'CATCH_UP') {
    return `Ponete al día con ${target} tarea${target > 1 ? 's' : ''} vencida${target > 1 ? 's' : ''}`;
  }
  if (type === 'COMPLETE_N') {
    return `Completá ${target} tarea${target > 1 ? 's' : ''} esta semana`;
  }
  return 'Revisá las tareas de la próxima semana';
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

  if (!challenge) return null;

  const { type, target, progress, completed } = challenge;
  const pct = target > 0 ? Math.min(100, Math.round((progress / target) * 100)) : 0;

  const theme = completed
    ? { border: 'border-success/30', bg: 'bg-success/5', bar: 'bg-success' }
    : { border: 'border-border', bg: 'bg-card', bar: 'bg-primary' };

  return (
    <Card className={`${theme.border} ${theme.bg} mb-4`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold">
            {completed ? '🎯 ¡Desafío completado!' : 'Desafío de la semana'}
          </p>
          <span className="text-muted-foreground text-xs font-medium tabular-nums">
            {progress} de {target}
          </span>
        </div>
        <p className="text-muted-foreground mt-1 text-xs">
          {completed
            ? 'Completaste el desafío de esta semana.'
            : challengeDescription(type, target)}
        </p>
        <div className="bg-muted mt-2 h-2 overflow-hidden rounded-full">
          <div
            className={`${theme.bar} h-full rounded-full transition-all`}
            style={{ width: `${pct}%` }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={target}
            aria-label={`Progreso del desafío semanal: ${progress} de ${target}`}
          />
        </div>
      </CardContent>
    </Card>
  );
}
