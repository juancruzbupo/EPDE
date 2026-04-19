import type { ConditionFound } from '@epde/shared';
import { CONDITION_FOUND_LABELS } from '@epde/shared';
import React from 'react';

import { Title } from './report-primitives';

interface PhotoLogEntry {
  id: string;
  completedAt: string;
  conditionFound: ConditionFound;
  photoUrl: string;
  task: { name: string };
}

export const ReportPhotoGallery = React.memo(function ReportPhotoGallery({
  logs,
}: {
  logs: PhotoLogEntry[];
}) {
  if (logs.length <= 1) return null;

  return (
    <section className="report-section mb-10 print:break-before-page">
      <Title>Registro Fotográfico</Title>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 print:grid-cols-3">
        {logs.map((l) => (
          <div key={l.id} className="report-item">
            <img
              src={l.photoUrl}
              alt={`Foto: ${l.task.name}`}
              className="aspect-[4/3] w-full rounded-lg object-cover"
              loading="lazy"
            />
            <p className="mt-1 text-sm font-medium">{l.task.name}</p>
            <p className="text-muted-foreground text-sm">
              {new Date(l.completedAt).toLocaleDateString('es-AR')} ·{' '}
              {CONDITION_FOUND_LABELS[l.conditionFound] ?? l.conditionFound}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
});
