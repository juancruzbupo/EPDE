import { PROFESSIONAL_REQUIREMENT_LABELS } from '@epde/shared';
import React from 'react';

import { Title } from './report-primitives';

interface UpcomingTask {
  id: string;
  name: string;
  nextDueDate: string | null;
  professionalRequirement: keyof typeof PROFESSIONAL_REQUIREMENT_LABELS;
  category: { name: string };
}

export const ReportMaintenancePlan = React.memo(function ReportMaintenancePlan({
  tasks,
}: {
  tasks: UpcomingTask[];
}) {
  if (tasks.length === 0) return null;

  return (
    <section className="report-section mb-10 print:break-before-page">
      <Title>Plan de Mantenimiento — Próximas Tareas</Title>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-border border-b">
            <th className="py-2 text-left font-medium">Tarea</th>
            <th className="py-2 text-left font-medium">Categoría</th>
            <th className="py-2 text-center font-medium">Fecha</th>
            <th className="py-2 text-center font-medium">Quién</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((t) => (
            <tr key={t.id} className="border-border border-b">
              <td className="py-2 font-medium">{t.name}</td>
              <td className="text-muted-foreground py-2">{t.category.name}</td>
              <td className="py-2 text-center">
                {t.nextDueDate ? new Date(t.nextDueDate).toLocaleDateString('es-AR') : '—'}
              </td>
              <td className="py-2 text-center text-xs">
                {PROFESSIONAL_REQUIREMENT_LABELS[t.professionalRequirement]}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
});
