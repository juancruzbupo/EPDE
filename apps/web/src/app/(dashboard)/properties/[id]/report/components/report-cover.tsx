import { PROPERTY_TYPE_LABELS } from '@epde/shared';
import React from 'react';

import { Bar, scoreBg, scoreColor, scoreLabel } from './report-primitives';

interface ReportCoverProps {
  property: {
    address: string;
    city: string;
    type: string;
    yearBuilt?: number | null;
    squareMeters?: number | null;
    user?: { name: string } | null;
  };
  score: number;
  totalTasks: number;
}

export const ReportCover = React.memo(function ReportCover({
  property,
  score,
  totalTasks,
}: ReportCoverProps) {
  return (
    <section className="report-section mb-10">
      <div className="mb-8 text-center">
        <p className="type-title-lg font-heading text-primary mb-1">EPDE</p>
        <h1 className="type-display-lg font-heading text-foreground mb-2">
          Informe Técnico de Diagnóstico Edilicio
        </h1>
        <p className="text-muted-foreground">
          {property.address}, {property.city}
        </p>
        <p className="text-muted-foreground text-sm">
          {PROPERTY_TYPE_LABELS[property.type as keyof typeof PROPERTY_TYPE_LABELS] ??
            property.type}
          {property.yearBuilt ? ` · Año ${property.yearBuilt}` : ''}
          {property.squareMeters ? ` · ${property.squareMeters} m²` : ''}
        </p>
        {property.user && (
          <p className="text-muted-foreground mt-1 text-sm">Propietario: {property.user.name}</p>
        )}
        <p className="text-muted-foreground mt-2 text-xs">
          Generado el{' '}
          {new Date().toLocaleDateString('es-AR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>
      <div className="bg-card border-border mx-auto max-w-md rounded-2xl border p-6 text-center">
        <p className="text-muted-foreground mb-1 text-sm">Índice de Salud de la Vivienda</p>
        {score > 0 ? (
          <>
            <p className={`text-5xl font-bold ${scoreColor(score)}`}>{score}</p>
            <p className={`text-lg font-medium ${scoreColor(score)}`}>{scoreLabel(score)}</p>
          </>
        ) : (
          <>
            <p className="text-muted-foreground text-2xl font-bold">—</p>
            <p className="text-muted-foreground text-sm">Diagnóstico pendiente</p>
          </>
        )}
        <div className="mt-2">
          <Bar value={score} className={scoreBg(score)} />
        </div>
      </div>
      {totalTasks === 0 && (
        <div className="bg-muted/40 mt-6 rounded-xl p-5 text-center">
          <p className="text-muted-foreground text-sm">
            Este informe se completará a medida que se realicen las inspecciones programadas. Los
            datos se actualizan automáticamente con cada tarea completada.
          </p>
        </div>
      )}
    </section>
  );
});
