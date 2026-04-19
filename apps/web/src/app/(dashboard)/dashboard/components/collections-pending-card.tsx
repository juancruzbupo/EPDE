'use client';

import type { CollectionsPending } from '@epde/shared';
import { formatARSCompact } from '@epde/shared';
import { AlertCircle, ArrowRight, HandCoins } from 'lucide-react';
import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ROUTES } from '@/lib/routes';

interface Props {
  summary: CollectionsPending;
}

/**
 * Card de cobranza pendiente: inspecciones REPORT_READY sin pago +
 * suscripciones vencidas/por vencer. Lista 5 items más viejos con link
 * directo para acción.
 */
export function CollectionsPendingCard({ summary }: Props) {
  const hasSubscriptionAlerts =
    summary.subscriptionsAlreadyExpired > 0 || summary.subscriptionsExpiringIn7d > 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <HandCoins className="text-primary h-4 w-4" />
            Cobranza pendiente
          </CardTitle>
          <span className="text-muted-foreground text-xs tabular-nums">
            {summary.itemsCount} items
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-muted-foreground text-xs">Total pendiente de cobro</p>
          <p className="text-foreground text-3xl font-bold tabular-nums">
            {formatARSCompact(summary.totalPendingAmount)}
          </p>
          {summary.oldestItemDays !== null && summary.oldestItemDays > 7 && (
            <p className="text-destructive mt-1 text-xs">
              Más viejo: hace {summary.oldestItemDays} días
            </p>
          )}
        </div>

        {summary.topOldest.length > 0 && (
          <div className="space-y-2">
            <p className="text-muted-foreground text-xs font-medium">Items más viejos</p>
            <div className="space-y-1.5">
              {summary.topOldest.map((item) => (
                <Link
                  key={item.id}
                  href={ROUTES.technicalInspection(item.id)}
                  className="hover:bg-muted/40 flex items-center justify-between gap-2 rounded-md border p-2 text-xs transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground truncate font-medium">{item.clientName}</p>
                    <p className="text-muted-foreground truncate text-[11px]">
                      {item.propertyAddress ?? 'Sin propiedad'} · hace {item.daysOld}d
                    </p>
                  </div>
                  <span className="text-foreground font-semibold tabular-nums">
                    {formatARSCompact(item.amount)}
                  </span>
                  <ArrowRight className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {hasSubscriptionAlerts && (
          <div className="border-warning/30 bg-warning/5 flex items-start gap-2 rounded-lg border p-3">
            <AlertCircle className="text-warning mt-0.5 h-4 w-4 shrink-0" />
            <div className="text-foreground space-y-0.5 text-xs leading-relaxed">
              {summary.subscriptionsAlreadyExpired > 0 && (
                <p>
                  <strong>{summary.subscriptionsAlreadyExpired}</strong> suscripciones ya vencidas.
                </p>
              )}
              {summary.subscriptionsExpiringIn7d > 0 && (
                <p>
                  <strong>{summary.subscriptionsExpiringIn7d}</strong> vencen en los próximos 7
                  días.
                </p>
              )}
            </div>
          </div>
        )}

        {summary.itemsCount === 0 && !hasSubscriptionAlerts && (
          <p className="text-muted-foreground text-center text-xs italic">
            No hay cobranza pendiente.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
