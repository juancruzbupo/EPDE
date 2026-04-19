'use client';

import type { TechnicalInspectionsSummary } from '@epde/shared';
import { formatARSCompact } from '@epde/shared';
import { AlertTriangle, Calendar, ClipboardCheck, FileText, Wallet } from 'lucide-react';
import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ROUTES } from '@/lib/routes';

interface Props {
  summary: TechnicalInspectionsSummary;
}

/**
 * Card operativa de inspecciones técnicas para el dashboard admin.
 * Responde "¿qué inspecciones necesitan mi atención esta semana?" de un vistazo.
 *
 * Warning visual si hay informes listos sin pagar de más de 7 días (cuello
 * de cobranza). Link directo al filtro REPORT_READY para acción rápida.
 */
export function TechnicalInspectionsCard({ summary }: Props) {
  const paymentCollectionBottleneck =
    summary.awaitingPayment > 0 &&
    summary.oldestAwaitingPaymentDays !== null &&
    summary.oldestAwaitingPaymentDays > 7;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardCheck className="text-primary h-4 w-4" />
            Inspecciones técnicas
          </CardTitle>
          <span className="text-muted-foreground text-xs tabular-nums">
            {summary.totalActive} activas
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <Link
            href={`${ROUTES.technicalInspections}?status=REQUESTED`}
            className="hover:bg-muted/40 rounded-lg border p-3 transition-colors"
          >
            <Calendar className="text-muted-foreground h-4 w-4" />
            <p className="mt-2 text-2xl font-bold tabular-nums">{summary.awaitingSchedule}</p>
            <p className="text-muted-foreground text-xs">Por agendar</p>
          </Link>
          <Link
            href={`${ROUTES.technicalInspections}?status=IN_PROGRESS`}
            className="hover:bg-muted/40 rounded-lg border p-3 transition-colors"
          >
            <FileText className="text-muted-foreground h-4 w-4" />
            <p className="mt-2 text-2xl font-bold tabular-nums">{summary.inProgress}</p>
            <p className="text-muted-foreground text-xs">En curso</p>
          </Link>
          <Link
            href={`${ROUTES.technicalInspections}?status=REPORT_READY`}
            className={`rounded-lg border p-3 transition-colors ${
              paymentCollectionBottleneck
                ? 'border-destructive/40 bg-destructive/5 hover:bg-destructive/10'
                : 'hover:bg-muted/40'
            }`}
          >
            <Wallet
              className={`h-4 w-4 ${
                paymentCollectionBottleneck ? 'text-destructive' : 'text-muted-foreground'
              }`}
            />
            <p className="mt-2 text-2xl font-bold tabular-nums">{summary.awaitingPayment}</p>
            <p className="text-muted-foreground text-xs">Esperando pago</p>
          </Link>
        </div>

        {paymentCollectionBottleneck && (
          <div className="border-destructive/30 bg-destructive/5 flex items-start gap-2 rounded-lg border p-3">
            <AlertTriangle className="text-destructive mt-0.5 h-4 w-4 shrink-0" />
            <p className="text-foreground text-xs leading-relaxed">
              <strong>Cuello de cobranza:</strong> hay informes listos sin pagar hace{' '}
              {summary.oldestAwaitingPaymentDays} días. Seguí el recordatorio al cliente.
            </p>
          </div>
        )}

        <div className="border-t pt-3">
          <div className="flex items-baseline justify-between">
            <span className="text-muted-foreground text-xs">Facturado este mes</span>
            <span className="text-foreground text-lg font-bold tabular-nums">
              {formatARSCompact(summary.revenueThisMonth)}
            </span>
          </div>
          <div className="text-muted-foreground mt-2 flex justify-between text-xs tabular-nums">
            <span>Mix: básico {summary.mixByType.BASIC}</span>
            <span>estructural {summary.mixByType.STRUCTURAL}</span>
            <span>compraventa {summary.mixByType.SALE}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
