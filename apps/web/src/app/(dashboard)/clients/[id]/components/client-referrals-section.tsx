'use client';

import type { ReferralHistoryItem } from '@epde/shared';
import { Gift, RefreshCw } from 'lucide-react';
import { memo, useState } from 'react';

import { ConfirmDialog } from '@/components/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useClientReferrals,
  useMarkReferralConverted,
  useRecomputeReferrerState,
} from '@/hooks/use-referrals';

interface ClientReferralsSectionProps {
  clientId: string;
  clientName: string;
}

/**
 * Admin-only — referral panel inside the client detail page. Lets the
 * operator: (1) see this client's code + stats, (2) mark a PENDING
 * referral as paid (the manual bridge until a payment system exists,
 * see ADR-010), (3) trigger a drift-recovery recompute if denormalized
 * counters look off.
 *
 * The "convert" action is destructive in the sense that it triggers the
 * server-side reward extension + sends a milestone email — irreversible.
 * Both mutations go through ConfirmDialog.
 */
export const ClientReferralsSection = memo(function ClientReferralsSection({
  clientId,
  clientName,
}: ClientReferralsSectionProps) {
  const { data, isLoading, isError } = useClientReferrals(clientId);
  const markConverted = useMarkReferralConverted();
  const recompute = useRecomputeReferrerState();

  const [pendingConvert, setPendingConvert] = useState<ReferralHistoryItem | null>(null);
  const [confirmRecompute, setConfirmRecompute] = useState(false);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recomendaciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recomendaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground type-body-sm">
            Este cliente todavía no tiene un código de recomendación asignado.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { referralCode, stats, referralHistory } = data;
  const pendingReferrals = referralHistory.filter((r) => r.status === 'PENDING');

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-4 w-4" aria-hidden="true" />
            Recomendaciones
          </CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setConfirmRecompute(true)}
            disabled={recompute.isPending}
          >
            <RefreshCw className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Recalcular estado
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Código" value={referralCode} mono />
            <Stat label="Recomendaciones" value={String(stats.totalReferrals)} />
            <Stat label="Conversiones" value={String(stats.convertedCount)} />
            <Stat label="Meses ganados" value={String(stats.creditsEarned.months)} />
          </div>

          <div>
            <h3 className="type-label-lg text-foreground mb-2">
              Recomendaciones pendientes ({pendingReferrals.length})
            </h3>
            {pendingReferrals.length === 0 ? (
              <p className="text-muted-foreground type-body-sm">
                No hay recomendaciones pendientes para marcar como pagadas.
              </p>
            ) : (
              <ul className="divide-border divide-y rounded-lg border">
                {pendingReferrals.map((referral) => (
                  <li
                    key={referral.id}
                    className="flex items-center justify-between gap-3 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="type-body-sm text-foreground truncate">
                        Registrada{' '}
                        {new Date(referral.createdAt).toLocaleDateString('es-AR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                      <Badge variant="warning" className="mt-1">
                        Pendiente
                      </Badge>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setPendingConvert(referral)}
                      disabled={markConverted.isPending}
                    >
                      Marcar como pagada
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={pendingConvert !== null}
        onOpenChange={(open) => {
          if (!open) setPendingConvert(null);
        }}
        title="Marcar recomendación como pagada"
        description={`Esto extenderá la suscripción de ${clientName} y enviará un email celebrando el hito. La acción es irreversible.`}
        confirmLabel="Marcar como pagada"
        variant="default"
        isLoading={markConverted.isPending}
        onConfirm={() => {
          if (!pendingConvert) return;
          markConverted.mutate(pendingConvert.id, {
            onSuccess: () => setPendingConvert(null),
          });
        }}
      />

      <ConfirmDialog
        open={confirmRecompute}
        onOpenChange={setConfirmRecompute}
        title="Recalcular estado de recomendaciones"
        description={`Reconstruye el contador de conversiones de ${clientName} a partir del histórico real. No envía emails — usalo si los números se ven desincronizados.`}
        confirmLabel="Recalcular"
        variant="default"
        isLoading={recompute.isPending}
        onConfirm={() => {
          recompute.mutate(clientId, {
            onSuccess: () => setConfirmRecompute(false),
          });
        }}
      />
    </>
  );
});

function Stat({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="border-border bg-muted/30 rounded-lg border p-3">
      <p className="text-muted-foreground type-label-sm">{label}</p>
      <p
        className={`text-foreground mt-1 truncate ${mono ? 'font-mono text-sm' : 'type-title-sm'}`}
      >
        {value}
      </p>
    </div>
  );
}
