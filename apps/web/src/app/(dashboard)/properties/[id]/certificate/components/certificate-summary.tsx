import type { PropertyCertificateData } from '@epde/shared';
import { CheckCircle2, ClipboardCheck, MapPin, TrendingUp } from 'lucide-react';
import React from 'react';

interface CertificateSummaryProps {
  summary: PropertyCertificateData['summary'];
}

export const CertificateSummary = React.memo(function CertificateSummary({
  summary,
}: CertificateSummaryProps) {
  const stats = [
    {
      icon: CheckCircle2,
      label: 'Tareas completadas',
      value: summary.totalTasksCompleted,
    },
    {
      icon: ClipboardCheck,
      label: 'Inspecciones realizadas',
      value: summary.totalInspections,
    },
    {
      icon: MapPin,
      label: 'Sectores inspeccionados',
      value: `${summary.sectorsInspected} / ${summary.totalSectors}`,
    },
    {
      icon: TrendingUp,
      label: 'Tasa de cumplimiento',
      value: `${summary.complianceRate}%`,
    },
  ];

  return (
    <section className="report-section mb-10">
      <h2 className="type-title-lg text-foreground font-heading mb-4 border-b pb-2">
        Resumen de Mantenimiento
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-card border-border rounded-lg border p-4 text-center">
            <stat.icon className="text-primary mx-auto mb-2 h-6 w-6" />
            <p className="text-foreground text-2xl font-bold">{stat.value}</p>
            <p className="text-muted-foreground text-xs">{stat.label}</p>
          </div>
        ))}
      </div>
      {summary.totalInvested > 0 && (
        <p className="text-muted-foreground mt-3 text-center text-sm">
          Inversión total en mantenimiento: $ {summary.totalInvested.toLocaleString('es-AR')}
        </p>
      )}
    </section>
  );
});
