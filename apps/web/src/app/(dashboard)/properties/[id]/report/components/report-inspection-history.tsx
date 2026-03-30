import type { ConditionFound } from '@epde/shared';
import {
  ACTION_TAKEN_LABELS,
  CONDITION_FOUND_LABELS,
  PROPERTY_SECTOR_LABELS,
  TASK_RESULT_LABELS,
} from '@epde/shared';
import React from 'react';

import { CONDITION_SCORE, scoreColor, Title } from './report-primitives';

interface LogEntry {
  id: string;
  completedAt: string;
  result: keyof typeof TASK_RESULT_LABELS;
  conditionFound: ConditionFound;
  actionTaken: keyof typeof ACTION_TAKEN_LABELS;
  cost?: number | null;
  notes?: string | null;
  photoUrl?: string | null;
  task: {
    name: string;
    sector?: string | null;
    category: { name: string };
  };
}

export const ReportInspectionHistory = React.memo(function ReportInspectionHistory({
  logs,
}: {
  logs: LogEntry[];
}) {
  if (logs.length === 0) return null;

  return (
    <section className="report-section mb-10 print:break-before-page">
      <Title>Historial de Inspecciones Recientes</Title>
      <div className="space-y-3">
        {logs.slice(0, 12).map((l) => (
          <div key={l.id} className="report-item border-border rounded-lg border p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium">{l.task.name}</p>
                <p className="text-muted-foreground text-xs">
                  {l.task.category.name}
                  {l.task.sector &&
                    ` · ${PROPERTY_SECTOR_LABELS[l.task.sector as keyof typeof PROPERTY_SECTOR_LABELS] ?? l.task.sector}`}
                </p>
              </div>
              <p className="text-muted-foreground shrink-0 text-xs">
                {new Date(l.completedAt).toLocaleDateString('es-AR')}
              </p>
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
              <span>
                Resultado: <strong>{TASK_RESULT_LABELS[l.result] ?? l.result}</strong>
              </span>
              <span>
                Condición:{' '}
                <strong className={scoreColor(CONDITION_SCORE[l.conditionFound] ?? 50)}>
                  {CONDITION_FOUND_LABELS[l.conditionFound] ?? l.conditionFound}
                </strong>
              </span>
              <span>Acción: {ACTION_TAKEN_LABELS[l.actionTaken] ?? l.actionTaken}</span>
              {l.cost != null && <span>Costo: ${l.cost.toLocaleString('es-AR')}</span>}
            </div>
            {l.notes && <p className="text-muted-foreground mt-1 text-xs italic">{l.notes}</p>}
            {l.photoUrl && (
              <img
                src={l.photoUrl}
                alt={`Foto: ${l.task.name}`}
                className="mt-2 max-h-48 rounded-lg object-cover print:max-h-36"
                loading="lazy"
              />
            )}
          </div>
        ))}
      </div>
    </section>
  );
});
