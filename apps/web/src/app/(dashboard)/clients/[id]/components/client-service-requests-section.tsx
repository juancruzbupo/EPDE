import { SERVICE_STATUS_LABELS, SERVICE_STATUS_VARIANT } from '@epde/shared';
import { Wrench } from 'lucide-react';
import Link from 'next/link';
import { memo } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useServiceRequests } from '@/hooks/use-service-requests';

interface ClientServiceRequestsSectionProps {
  clientId: string;
  clientName: string;
}

export const ClientServiceRequestsSection = memo(function ClientServiceRequestsSection({
  clientId,
  clientName,
}: ClientServiceRequestsSectionProps) {
  const { data, isLoading } = useServiceRequests({ userId: clientId, take: 5 });
  const requests = data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Wrench className="h-4 w-4" aria-hidden="true" />
          Solicitudes de Servicio
          {requests.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {requests.length}
            </Badge>
          )}
        </CardTitle>
        <Link
          href={`/service-requests?search=${encodeURIComponent(clientName)}`}
          className="text-muted-foreground hover:text-foreground text-xs transition-colors"
        >
          Ver todos
        </Link>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <p className="text-muted-foreground text-sm">Sin solicitudes</p>
        ) : (
          <ul className="divide-y">
            {requests.map((sr) => (
              <li
                key={sr.id}
                className="flex items-center justify-between py-2 first:pt-0 last:pb-0"
              >
                <Link
                  href={`/service-requests/${sr.id}`}
                  className="text-sm font-medium hover:underline"
                >
                  {sr.title}
                </Link>
                <Badge
                  variant={SERVICE_STATUS_VARIANT[sr.status] ?? 'secondary'}
                  className="text-xs"
                >
                  {SERVICE_STATUS_LABELS[sr.status] ?? sr.status}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
});
