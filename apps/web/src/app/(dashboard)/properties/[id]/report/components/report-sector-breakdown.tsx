import { PROPERTY_SECTOR_LABELS } from '@epde/shared';
import React from 'react';

import { Bar, scoreColor, Title } from './report-primitives';

interface SectorItem {
  sector: string;
  total: number;
  overdue: number;
  score: number;
}

export const ReportSectorBreakdown = React.memo(function ReportSectorBreakdown({
  sectors,
}: {
  sectors: SectorItem[];
}) {
  if (sectors.length === 0) return null;

  return (
    <section className="report-section mb-10 print:break-before-page">
      <Title>Estado por Sector</Title>
      <p className="text-muted-foreground mb-4 text-sm">
        Ordenados del sector que más atención necesita al que mejor está.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 print:grid-cols-2">
        {sectors.map((s) => (
          <div key={s.sector} className="report-item border-border rounded-lg border p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-medium">
                {PROPERTY_SECTOR_LABELS[s.sector as keyof typeof PROPERTY_SECTOR_LABELS] ??
                  s.sector}
              </p>
              <span className={`text-sm font-bold ${scoreColor(s.score)}`}>{s.score}%</span>
            </div>
            <Bar value={s.score} />
            <div className="text-muted-foreground mt-2 flex justify-between text-sm">
              <span>{s.total} tareas</span>
              {s.overdue > 0 && (
                <span className="text-destructive font-medium">{s.overdue} vencidas</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
});
