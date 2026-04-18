'use client';

import { QUERY_KEYS } from '@epde/shared';
import { useQuery } from '@tanstack/react-query';
import { Shield } from 'lucide-react';
import Link from 'next/link';
import { use, useEffect } from 'react';

import { ErrorState } from '@/components/error-state';
import { Button } from '@/components/ui/button';
import { getPropertyCertificate } from '@/lib/api/properties';
import { ROUTES } from '@/lib/routes';

import { CertificateCover } from './components/certificate-cover';
import { CertificateFooter } from './components/certificate-footer';
import { CertificateHeader } from './components/certificate-header';
import { CertificateHealthScore } from './components/certificate-health-score';
import { CertificateHighlights } from './components/certificate-highlights';
import { CertificateISVTrend } from './components/certificate-isv-trend';
import { CertificateSignature } from './components/certificate-signature';
import { CertificateSummary } from './components/certificate-summary';

export default function PropertyCertificatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  useEffect(() => {
    document.title = 'Certificado de Mantenimiento Preventivo | EPDE';
  }, []);

  const {
    data: cert,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: [QUERY_KEYS.properties, id, QUERY_KEYS.propertyCertificate],
    queryFn: ({ signal }) => getPropertyCertificate(id, signal).then((r) => r.data),
    staleTime: 5 * 60_000,
    retry: false,
  });

  if (isLoading) {
    return (
      <div
        role="status"
        aria-label="Cargando"
        className="flex min-h-[60vh] items-center justify-center"
      >
        <div className="text-muted-foreground text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-current border-t-transparent" />
          <p>Generando certificado...</p>
        </div>
      </div>
    );
  }

  if (isError || !cert) {
    const backendMessage = (error as { response?: { data?: { message?: string } } })?.response?.data
      ?.message;
    const isEligibilityError = backendMessage?.includes('1 año') || backendMessage?.includes('ISV');

    return (
      <div className="mx-auto max-w-lg py-12">
        {isEligibilityError ? (
          <div className="bg-card border-border rounded-xl border p-8 text-center">
            <Shield className="text-muted-foreground mx-auto mb-4 h-10 w-10" />
            <h2 className="type-title-md text-foreground mb-2">Certificado no disponible aún</h2>
            <p className="text-muted-foreground type-body-sm mb-6">{backendMessage}</p>
            <p className="text-muted-foreground mb-6 text-xs italic">
              El certificado acredita mantenimiento preventivo profesional. Requiere al menos 1 año
              de uso de la herramienta y un ISV mayor a 60.
            </p>
            <Button variant="outline" asChild>
              <Link href={ROUTES.property(id)}>Volver a la propiedad</Link>
            </Button>
          </div>
        ) : (
          <ErrorState
            message={backendMessage ?? 'No se pudo generar el certificado'}
            onRetry={refetch}
          />
        )}
      </div>
    );
  }

  return (
    <div className="report-container mx-auto max-w-4xl">
      <CertificateHeader propertyId={id} />
      <CertificateCover data={cert} />
      <CertificateHealthScore healthIndex={cert.healthIndex} />
      <CertificateSummary summary={cert.summary} />
      <CertificateISVTrend history={cert.isvHistory} />
      <CertificateHighlights highlights={cert.highlights} />
      <CertificateSignature
        architect={cert.architect}
        certificateNumber={cert.certificateNumber}
        issuedAt={cert.issuedAt}
      />
      <CertificateFooter />
    </div>
  );
}
