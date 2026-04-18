import type { ISVSnapshotPublic } from '@epde/shared';
import React from 'react';

import { scoreColor } from '../../report/components/report-primitives';

interface CertificateISVTrendProps {
  history: ISVSnapshotPublic[];
}

export const CertificateISVTrend = React.memo(function CertificateISVTrend({
  history,
}: CertificateISVTrendProps) {
  if (history.length < 2) return null;

  const first = history[0]!;
  const last = history[history.length - 1]!;
  const delta = last.score - first.score;

  return (
    <section className="report-section mb-10">
      <h2 className="type-title-lg text-foreground font-heading mb-4 border-b pb-2">
        Evolución del ISV
      </h2>

      <div className="bg-card border-border overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-border border-b">
              <th className="text-muted-foreground px-4 py-2 text-left font-medium">Mes</th>
              <th className="text-muted-foreground px-4 py-2 text-right font-medium">ISV</th>
              <th className="text-muted-foreground px-4 py-2 text-right font-medium">
                Cumplimiento
              </th>
              <th className="text-muted-foreground px-4 py-2 text-right font-medium">Condición</th>
              <th className="text-muted-foreground px-4 py-2 text-right font-medium">Cobertura</th>
            </tr>
          </thead>
          <tbody>
            {history.map((snap, i) => (
              <tr key={i} className="border-border border-b last:border-0">
                <td className="text-foreground px-4 py-2">{snap.month}</td>
                <td className={`px-4 py-2 text-right font-bold ${scoreColor(snap.score)}`}>
                  {snap.score}
                </td>
                <td className="px-4 py-2 text-right">{snap.compliance}</td>
                <td className="px-4 py-2 text-right">{snap.condition}</td>
                <td className="px-4 py-2 text-right">{snap.coverage}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-muted-foreground mt-3 text-center text-sm">
        Variación en el período:{' '}
        <span className={delta >= 0 ? 'text-success font-medium' : 'text-destructive font-medium'}>
          {delta >= 0 ? '+' : ''}
          {delta} puntos
        </span>
      </p>
    </section>
  );
});
