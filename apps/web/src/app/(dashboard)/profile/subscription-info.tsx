'use client';

import { WHATSAPP_CONTACT_NUMBER } from '@epde/shared';
import { Clock } from 'lucide-react';
import { useMemo } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function SubscriptionInfo({ expiresAt }: { expiresAt: string }) {
  const { exp, isExpired, isNearExpiry, variant, label } = useMemo(() => {
    const d = new Date(expiresAt);
    const days = Math.ceil((d.getTime() - Date.now()) / (24 * 60 * 60_000));
    const expired = days < 0;
    const near = !expired && days <= 7;
    return {
      exp: d,
      daysLeft: days,
      isExpired: expired,
      isNearExpiry: near,
      variant: expired
        ? ('destructive' as const)
        : near
          ? ('warning' as const)
          : ('success' as const),
      label: expired ? 'Expirada' : `${days} día${days === 1 ? '' : 's'} restantes`,
    };
  }, [expiresAt]);

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4" aria-hidden="true" />
            Tu suscripción
          </CardTitle>
          <Badge variant={variant}>{label}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground text-sm">Vencimiento</dt>
            <dd className="text-sm font-medium">
              {exp.toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-sm">Estado</dt>
            <dd className="text-sm font-medium">{isExpired ? 'Sin acceso' : 'Acceso completo'}</dd>
          </div>
        </dl>
        {(isExpired || isNearExpiry) && (
          <div className="mt-4">
            <a
              href={`https://wa.me/${WHATSAPP_CONTACT_NUMBER}?text=Hola, quiero renovar mi suscripción a EPDE`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 text-sm font-medium"
            >
              Contactar para renovar →
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
