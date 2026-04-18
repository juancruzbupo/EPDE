import type { PropertyCertificateData } from '@epde/shared';
import React from 'react';

const CONDITION_LABELS: Record<string, string> = {
  EXCELLENT: 'Excelente',
  GOOD: 'Bueno',
  FAIR: 'Aceptable',
  POOR: 'Malo',
  CRITICAL: 'Crítico',
};

interface CertificateHighlightsProps {
  highlights: PropertyCertificateData['highlights'];
}

export const CertificateHighlights = React.memo(function CertificateHighlights({
  highlights,
}: CertificateHighlightsProps) {
  if (highlights.length === 0) return null;

  return (
    <section className="report-section mb-10">
      <h2 className="type-title-lg text-foreground font-heading mb-4 border-b pb-2">
        Trabajos Destacados
      </h2>
      <div className="space-y-3">
        {highlights.map((h, i) => (
          <div key={i} className="bg-card border-border rounded-lg border p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-foreground font-medium">{h.taskName}</p>
                <p className="text-muted-foreground text-sm">
                  {h.categoryName}
                  {h.sector ? ` · ${h.sector}` : ''}
                </p>
              </div>
              <div className="text-right">
                <p className="text-success text-sm font-medium">
                  {CONDITION_LABELS[h.conditionFound as keyof typeof CONDITION_LABELS] ??
                    h.conditionFound}
                </p>
                <p className="text-muted-foreground text-xs">
                  {new Date(h.completedAt).toLocaleDateString('es-AR')}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
});
