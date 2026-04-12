import { PLAN_STATUS_LABELS, PLAN_STATUS_VARIANT } from '@epde/shared';
import { Home, Plus } from 'lucide-react';
import Link from 'next/link';
import { memo } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useProperties } from '@/hooks/use-properties';

interface ClientPropertiesSectionProps {
  clientId: string;
}

export const ClientPropertiesSection = memo(function ClientPropertiesSection({
  clientId,
}: ClientPropertiesSectionProps) {
  const { data: propertiesData } = useProperties({ userId: clientId });
  const properties = propertiesData?.pages.flatMap((p) => p.data) ?? [];
  const displayProperties = properties.slice(0, 5);

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Home className="h-4 w-4" aria-hidden="true" />
          Propiedades
          {properties.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {properties.length}
            </Badge>
          )}
        </CardTitle>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/properties?newFor=${clientId}`}>
            <Plus className="mr-2 h-4 w-4" />
            Agregar propiedad
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {displayProperties.length === 0 ? (
          <p className="text-muted-foreground text-sm">Sin propiedades</p>
        ) : (
          <ul className="divide-y">
            {displayProperties.map((prop) => (
              <li
                key={prop.id}
                className="flex items-center justify-between py-2 first:pt-0 last:pb-0"
              >
                <Link
                  href={`/properties/${prop.id}`}
                  className="text-sm font-medium hover:underline"
                >
                  {prop.address}, {prop.city}
                </Link>
                {prop.maintenancePlan ? (
                  <Badge variant={PLAN_STATUS_VARIANT[prop.maintenancePlan.status] ?? 'secondary'}>
                    {PLAN_STATUS_LABELS[prop.maintenancePlan.status] ?? prop.maintenancePlan.status}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground text-xs">Sin plan</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
});
