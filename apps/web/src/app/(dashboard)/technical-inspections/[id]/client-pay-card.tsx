'use client';

import { formatARSCompact, type TechnicalInspectionPublic } from '@epde/shared';
import { Clock, FileText, Info } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  inspection: TechnicalInspectionPublic;
}

const STATUS_COPY: Record<
  TechnicalInspectionPublic['status'],
  { title: string; description: string }
> = {
  REQUESTED: {
    title: 'Solicitud recibida',
    description: 'Nos pondremos en contacto para coordinar la visita.',
  },
  SCHEDULED: {
    title: 'Visita agendada',
    description: 'Ya coordinamos la fecha con vos. El día de la visita realizamos el relevamiento.',
  },
  IN_PROGRESS: {
    title: 'Inspección en curso',
    description: 'Estamos procesando el relevamiento. En breve tendrás el informe.',
  },
  REPORT_READY: {
    title: 'Informe listo — pendiente de pago',
    description:
      'Descargá el informe desde arriba. Realizá la transferencia y subiremos el comprobante al registrar tu pago.',
  },
  PAID: {
    title: 'Pagada',
    description: 'Gracias por tu pago. El informe queda archivado en esta propiedad.',
  },
  CANCELED: {
    title: 'Cancelada',
    description: 'La inspección fue cancelada.',
  },
};

export function ClientPayCard({ inspection }: Props) {
  const copy = STATUS_COPY[inspection.status];
  const showPaymentInfo = inspection.status === 'REPORT_READY';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Estado de tu solicitud</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Clock className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="text-sm font-medium">{copy.title}</p>
            <p className="text-muted-foreground mt-0.5 text-sm">{copy.description}</p>
          </div>
        </div>

        {showPaymentInfo && (
          <Alert className="border-primary/30 bg-primary/5">
            <Info aria-hidden="true" />
            <AlertTitle>Cómo pagar {formatARSCompact(inspection.feeAmount)}</AlertTitle>
            <AlertDescription>
              <p>
                Realizá la transferencia a la cuenta bancaria de EPDE (te la enviamos por email al
                emitir el informe). Una vez acreditada, marcamos la inspección como pagada.
              </p>
              <p className="mt-2">
                <strong>Dudas:</strong> respondé al email con el comprobante adjunto.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {inspection.deliverableUrl && (
          <a
            href={inspection.deliverableUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium"
          >
            <FileText className="h-4 w-4" />
            Descargar informe firmado
          </a>
        )}
      </CardContent>
    </Card>
  );
}
