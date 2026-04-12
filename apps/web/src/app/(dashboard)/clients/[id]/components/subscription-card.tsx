import type { ClientPublic } from '@epde/shared';
import { formatRelativeDate } from '@epde/shared';
import { Clock } from 'lucide-react';
import { memo, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { ConfirmDialog } from '@/components/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUpdateClient } from '@/hooks/use-clients';

interface SubscriptionCardProps {
  client: ClientPublic;
  clientId: string;
}

export const SubscriptionCard = memo(function SubscriptionCard({
  client,
  clientId,
}: SubscriptionCardProps) {
  const updateClient = useUpdateClient();
  const [extending, setExtending] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'suspend' | 'removeLimit' | null>(null);

  const { expiresAt, statusLabel, statusVariant } = useMemo(() => {
    const exp = client.subscriptionExpiresAt ? new Date(client.subscriptionExpiresAt) : null;
    const expired = exp ? exp.getTime() < Date.now() : false;
    const days = exp ? Math.ceil((exp.getTime() - Date.now()) / (24 * 60 * 60_000)) : null;

    let label: string;
    let variant: 'destructive' | 'secondary' | 'warning' | 'success';
    if (!exp) {
      label = 'Sin suscripción';
      variant = 'secondary';
    } else if (expired) {
      label = 'Expirada';
      variant = 'destructive';
    } else if (days !== null && days <= 7) {
      label = `Vence en ${days} día${days === 1 ? '' : 's'}`;
      variant = 'warning';
    } else {
      label = 'Activa';
      variant = 'success';
    }

    return {
      expiresAt: exp,
      isExpired: expired,
      daysLeft: days,
      statusLabel: label,
      statusVariant: variant,
    };
  }, [client.subscriptionExpiresAt]);

  const handleExtend = (days: number) => {
    setExtending(true);
    const baseDate = expiresAt && expiresAt > new Date() ? expiresAt : new Date();
    const newExpiry = new Date(baseDate.getTime() + days * 24 * 60 * 60_000);
    updateClient.mutate(
      { id: clientId, subscriptionExpiresAt: newExpiry },
      {
        onSuccess: () => {
          toast.success(`Suscripción extendida ${days} días`);
          setExtending(false);
        },
        onError: () => setExtending(false),
      },
    );
  };

  const handleSuspend = () => {
    setExtending(true);
    updateClient.mutate(
      { id: clientId, subscriptionExpiresAt: new Date() },
      {
        onSuccess: () => {
          toast.success('Suscripción suspendida — el cliente ya no tiene acceso');
          setExtending(false);
        },
        onError: () => setExtending(false),
      },
    );
  };

  const handleRemoveLimit = () => {
    setExtending(true);
    updateClient.mutate(
      { id: clientId, subscriptionExpiresAt: null },
      {
        onSuccess: () => {
          toast.success('Límite de suscripción removido — acceso ilimitado');
          setExtending(false);
        },
        onError: () => setExtending(false),
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4" aria-hidden="true" />
            Suscripción
          </CardTitle>
          <Badge variant={statusVariant}>{statusLabel}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div className="space-y-1">
            <dt className="text-muted-foreground">Activación</dt>
            <dd className="font-medium">
              {client.activatedAt
                ? formatRelativeDate(new Date(client.activatedAt))
                : 'No activado'}
            </dd>
          </div>
          <div className="space-y-1">
            <dt className="text-muted-foreground">Vencimiento</dt>
            <dd className="font-medium">
              {expiresAt ? expiresAt.toLocaleDateString('es-AR') : '—'}
            </dd>
          </div>
        </dl>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => handleExtend(30)} disabled={extending}>
            +30 días
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleExtend(60)} disabled={extending}>
            +60 días
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleExtend(365)}
            disabled={extending}
          >
            +1 año
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setConfirmAction('suspend')}
            disabled={extending}
          >
            Suspender
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => setConfirmAction('removeLimit')}
            disabled={extending}
          >
            Quitar límite
          </Button>
        </div>

        <ConfirmDialog
          open={confirmAction === 'suspend'}
          onOpenChange={(open) => {
            if (!open) setConfirmAction(null);
          }}
          title="Suspender suscripción"
          description="El cliente perderá acceso inmediatamente y verá la pantalla de suscripción expirada. ¿Continuar?"
          onConfirm={() => {
            setConfirmAction(null);
            handleSuspend();
          }}
          isLoading={extending}
        />
        <ConfirmDialog
          open={confirmAction === 'removeLimit'}
          onOpenChange={(open) => {
            if (!open) setConfirmAction(null);
          }}
          title="Quitar límite de suscripción"
          description="El cliente tendrá acceso ilimitado sin fecha de vencimiento. ¿Continuar?"
          onConfirm={() => {
            setConfirmAction(null);
            handleRemoveLimit();
          }}
          isLoading={extending}
        />
      </CardContent>
    </Card>
  );
});
