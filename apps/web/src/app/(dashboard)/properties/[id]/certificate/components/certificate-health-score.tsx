import type { PropertyCertificateData } from '@epde/shared';
import React from 'react';

import {
  Bar,
  DIM,
  scoreBg,
  scoreColor,
  scoreLabel,
} from '../../report/components/report-primitives';

interface CertificateHealthScoreProps {
  healthIndex: PropertyCertificateData['healthIndex'];
}

export const CertificateHealthScore = React.memo(function CertificateHealthScore({
  healthIndex,
}: CertificateHealthScoreProps) {
  const { score, dimensions } = healthIndex;

  return (
    <section className="report-section mb-10">
      <h2 className="type-title-lg text-foreground font-heading mb-4 border-b pb-2">
        Índice de Salud de la Vivienda (ISV)
      </h2>

      <div className="mb-6 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
        <div className="text-center">
          <p className={`text-5xl font-bold ${scoreColor(score)}`}>{score}</p>
          <p className={`text-lg font-medium ${scoreColor(score)}`}>{scoreLabel(score)}</p>
          <div className="mt-2 w-48">
            <Bar value={score} className={scoreBg(score)} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
        {Object.entries(dimensions).map(([key, value]) => {
          const dim = DIM[key];
          if (!dim) return null;
          return (
            <div key={key} className="bg-card border-border rounded-lg border p-3 text-center">
              <p className="text-muted-foreground text-xs">{dim.label}</p>
              <p className={`text-xl font-bold ${scoreColor(value)}`}>{value}</p>
              <Bar value={value} className={scoreBg(value)} />
            </div>
          );
        })}
      </div>
    </section>
  );
});
