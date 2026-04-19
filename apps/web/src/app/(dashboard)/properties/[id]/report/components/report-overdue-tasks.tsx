import type { TaskPriority } from '@epde/shared';
import {
  formatRelativeDate,
  PROFESSIONAL_REQUIREMENT_LABELS,
  PROPERTY_SECTOR_LABELS,
  TASK_PRIORITY_LABELS,
} from '@epde/shared';
import React from 'react';

import { Title } from './report-primitives';

interface OverdueTask {
  id: string;
  name: string;
  priority: TaskPriority;
  nextDueDate: string | null;
  professionalRequirement: keyof typeof PROFESSIONAL_REQUIREMENT_LABELS;
  sector?: string | null;
  category: { name: string };
}

export const ReportOverdueTasks = React.memo(function ReportOverdueTasks({
  tasks,
}: {
  tasks: OverdueTask[];
}) {
  if (tasks.length === 0) return null;

  return (
    <section className="report-section mb-10 print:break-before-page">
      <Title>Tareas que Requieren Atención</Title>
      <p className="text-muted-foreground mb-4 text-sm">
        Ordenadas por prioridad: las más urgentes primero.
      </p>
      <div className="space-y-2">
        {tasks.map((t) => (
          <div
            key={t.id}
            className="report-item border-destructive/20 bg-destructive/5 rounded-lg border p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">{t.name}</p>
                <p className="text-muted-foreground text-sm">
                  {t.category.name}
                  {t.sector &&
                    ` · ${PROPERTY_SECTOR_LABELS[t.sector as keyof typeof PROPERTY_SECTOR_LABELS] ?? t.sector}`}
                </p>
              </div>
              <div className="text-right text-sm">
                <p className="text-destructive font-medium">
                  {t.nextDueDate ? formatRelativeDate(new Date(t.nextDueDate)) : 'Sin fecha'}
                </p>
                <p className="text-muted-foreground">
                  {TASK_PRIORITY_LABELS[t.priority]}
                  {' · '}
                  {PROFESSIONAL_REQUIREMENT_LABELS[t.professionalRequirement]}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
});
