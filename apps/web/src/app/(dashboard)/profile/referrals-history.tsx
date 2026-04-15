'use client';

import type { ReferralHistoryItem } from '@epde/shared';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ReferralsHistoryProps {
  history: ReferralHistoryItem[];
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Last 50 referrals for the current user (server caps the query). Two
 * visual states per row:
 *   - PENDING  → "Recomendación pendiente" + warning badge + createdAt.
 *                We intentionally hide the referred user's name until
 *                they convert (privacy for declined invites).
 *   - CONVERTED → referredUser.name + success badge + convertedAt.
 *
 * Empty state is a short instructional copy that points at the share
 * actions card above.
 */
export function ReferralsHistory({ history }: ReferralsHistoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="type-title-md">Historial de recomendaciones</CardTitle>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <p className="text-muted-foreground type-body-sm">
            Todavía no se registraron recomendaciones con tu código. Cuando alguien se sume, va a
            aparecer acá.
          </p>
        ) : (
          <ul className="divide-border divide-y">
            {history.map((item) => {
              const isConverted = item.status === 'CONVERTED';
              const whenIso = isConverted ? (item.convertedAt ?? item.createdAt) : item.createdAt;
              return (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="type-label-lg text-foreground truncate">
                      {isConverted ? (item.referredName ?? 'Amigo/a') : 'Recomendación pendiente'}
                    </p>
                    <p className="text-muted-foreground type-body-sm">{formatDate(whenIso)}</p>
                  </div>
                  <Badge variant={isConverted ? 'success' : 'warning'}>
                    {isConverted ? 'Convertida' : 'Pendiente'}
                  </Badge>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
