import type { PropertyCertificateData } from '@epde/shared';
import React from 'react';

interface CertificateSignatureProps {
  architect: PropertyCertificateData['architect'];
  certificateNumber: string;
  issuedAt: string;
}

export const CertificateSignature = React.memo(function CertificateSignature({
  architect,
  certificateNumber,
  issuedAt,
}: CertificateSignatureProps) {
  return (
    <section className="report-section mb-10">
      <div className="border-border border-t pt-8">
        <div className="mx-auto max-w-md text-center">
          <div className="border-foreground mx-auto mb-2 w-48 border-b" />
          <p className="text-foreground font-medium">{architect.name}</p>
          <p className="text-muted-foreground text-sm">Arquitecto responsable — EPDE</p>
          <p className="text-muted-foreground mt-4 font-mono text-xs">
            {certificateNumber} · Emitido el{' '}
            {new Date(issuedAt).toLocaleDateString('es-AR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>
    </section>
  );
});
