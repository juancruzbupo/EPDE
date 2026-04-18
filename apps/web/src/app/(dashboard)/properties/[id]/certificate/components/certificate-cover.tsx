import type { PropertyCertificateData } from '@epde/shared';
import { PROPERTY_TYPE_LABELS } from '@epde/shared';
import { Shield } from 'lucide-react';
import React from 'react';

interface CertificateCoverProps {
  data: PropertyCertificateData;
}

export const CertificateCover = React.memo(function CertificateCover({
  data,
}: CertificateCoverProps) {
  const { certificateNumber, issuedAt, property, coveragePeriod } = data;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  return (
    <section className="report-section mb-10">
      <div className="border-primary/20 bg-card mx-auto max-w-2xl rounded-2xl border-2 p-8 text-center">
        <Shield className="text-primary mx-auto mb-4 h-12 w-12" />
        <p className="type-title-lg font-heading text-primary mb-1">EPDE</p>
        <p className="text-muted-foreground mb-4 text-sm">
          Estudio Profesional de Diagnóstico Edilicio
        </p>
        <h1 className="type-display-lg font-heading text-foreground mb-2">
          Certificado de Mantenimiento Preventivo
        </h1>
        <p className="text-muted-foreground mb-6 font-mono text-sm">{certificateNumber}</p>

        <div className="border-border mb-6 border-t pt-6">
          <p className="type-title-md text-foreground mb-1">
            {property.address}, {property.city}
          </p>
          <p className="text-muted-foreground text-sm">
            {PROPERTY_TYPE_LABELS[property.type as keyof typeof PROPERTY_TYPE_LABELS] ??
              property.type}
            {property.yearBuilt ? ` · Año ${property.yearBuilt}` : ''}
            {property.squareMeters ? ` · ${property.squareMeters} m²` : ''}
          </p>
          <p className="text-muted-foreground mt-1 text-sm">Propietario: {property.owner.name}</p>
        </div>

        <div className="bg-muted/30 rounded-lg p-4">
          <p className="text-muted-foreground text-xs tracking-wide uppercase">
            Período de cobertura
          </p>
          <p className="text-foreground text-sm font-medium">
            {formatDate(coveragePeriod.from)} — {formatDate(coveragePeriod.to)}
          </p>
          <p className="text-muted-foreground mt-2 text-xs">Emitido el {formatDate(issuedAt)}</p>
        </div>
      </div>
    </section>
  );
});
