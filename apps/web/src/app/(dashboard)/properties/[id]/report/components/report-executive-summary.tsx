import React from 'react';

import { Bar, DIM, scoreColor, statusMessage, Title } from './report-primitives';

interface TaskStats {
  overdue: number;
  pending: number;
  upcoming: number;
  completed: number;
}

interface ReportExecutiveSummaryProps {
  score: number;
  dimensions: Record<string, number>;
  taskStats: TaskStats;
}

const STAT_CARDS = [
  { key: 'overdue' as const, label: 'Vencidas', color: 'text-destructive bg-destructive/10' },
  {
    key: 'pending' as const,
    label: 'Pendientes',
    color: 'text-status-pending bg-status-pending/10',
  },
  {
    key: 'upcoming' as const,
    label: 'Próximas',
    color: 'text-status-upcoming bg-status-upcoming/10',
  },
  {
    key: 'completed' as const,
    label: 'Completadas',
    color: 'text-status-completed bg-status-completed/10',
  },
];

export const ReportExecutiveSummary = React.memo(function ReportExecutiveSummary({
  score,
  dimensions,
  taskStats,
}: ReportExecutiveSummaryProps) {
  return (
    <section className="report-section mb-10 print:break-before-page">
      <Title>Resumen Ejecutivo</Title>
      <div className="bg-muted/40 mb-6 rounded-xl p-5">
        <p className="type-body-md text-foreground leading-relaxed">{statusMessage(score)}</p>
      </div>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 print:grid-cols-2">
        {(Object.entries(dimensions) as [string, number][]).map(([k, v]) => {
          const d = DIM[k];
          if (!d) return null;
          return (
            <div key={k} className="report-item space-y-1.5">
              <div className="flex items-baseline justify-between">
                <p className="text-sm font-medium">{d.label}</p>
                <p className={`text-sm font-bold ${scoreColor(v)}`}>{v}/100</p>
              </div>
              <Bar value={v} />
              <p className="text-muted-foreground text-sm">{d.hint}</p>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 print:grid-cols-4">
        {STAT_CARDS.map((st) => (
          <div key={st.key} className={`report-item rounded-lg p-3 text-center ${st.color}`}>
            <p className="text-2xl font-bold">{taskStats[st.key]}</p>
            <p className="text-sm">{st.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
});
