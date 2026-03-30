import React from 'react';

import { scoreColor, Title } from './report-primitives';

interface CategoryItem {
  categoryName: string;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  avgCondition: number;
}

export const ReportCategoryBreakdown = React.memo(function ReportCategoryBreakdown({
  categories,
}: {
  categories: CategoryItem[];
}) {
  if (categories.length === 0) return null;

  return (
    <section className="report-section mb-10 print:break-before-page">
      <Title>Hallazgos por Categoría</Title>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-border border-b">
            <th className="py-2 text-left font-medium">Categoría</th>
            <th className="py-2 text-center font-medium">Total</th>
            <th className="py-2 text-center font-medium">Completadas</th>
            <th className="py-2 text-center font-medium">Vencidas</th>
            <th className="py-2 text-center font-medium">Condición</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((c) => (
            <tr key={c.categoryName} className="border-border border-b">
              <td className="py-2 font-medium">{c.categoryName}</td>
              <td className="py-2 text-center">{c.totalTasks}</td>
              <td className="text-status-completed py-2 text-center">{c.completedTasks}</td>
              <td
                className={`py-2 text-center ${c.overdueTasks > 0 ? 'text-destructive font-medium' : ''}`}
              >
                {c.overdueTasks}
              </td>
              <td className={`py-2 text-center font-medium ${scoreColor(c.avgCondition * 20)}`}>
                {c.avgCondition > 0 ? c.avgCondition.toFixed(1) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
});
