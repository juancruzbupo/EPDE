'use client';

import { useParams } from 'next/navigation';
import { useProperty } from '@/hooks/use-properties';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { PROPERTY_TYPE_LABELS, UserRole } from '@epde/shared';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';
import { PlanEditor } from './plan-editor';
import { PlanViewer } from './plan-viewer';

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useProperty(id);
  const isAdmin = useAuthStore((s) => s.user?.role === UserRole.ADMIN);
  const property = data?.data;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!property) {
    return <p className="text-muted-foreground">Propiedad no encontrada</p>;
  }

  return (
    <div>
      <PageHeader
        title={property.address}
        description={`${property.city} — ${PROPERTY_TYPE_LABELS[property.type] ?? property.type}`}
        action={
          <Button variant="outline" asChild>
            <Link href="/properties">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Link>
          </Button>
        }
      />

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Detalles</TabsTrigger>
          <TabsTrigger value="plan">Plan de Mantenimiento</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Información de la propiedad</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground text-sm">Dirección</dt>
                  <dd className="font-medium">{property.address}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-sm">Ciudad</dt>
                  <dd className="font-medium">{property.city}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-sm">Tipo</dt>
                  <dd>
                    <Badge variant="outline">
                      {PROPERTY_TYPE_LABELS[property.type] ?? property.type}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-sm">Año de construcción</dt>
                  <dd className="font-medium">{property.yearBuilt ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-sm">Metros cuadrados</dt>
                  <dd className="font-medium">{property.squareMeters ?? '—'}</dd>
                </div>
                {property.user && (
                  <div>
                    <dt className="text-muted-foreground text-sm">Cliente</dt>
                    <dd className="font-medium">{property.user.name}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plan" className="mt-4">
          {property.maintenancePlan ? (
            isAdmin ? (
              <PlanEditor planId={property.maintenancePlan.id} />
            ) : (
              <PlanViewer planId={property.maintenancePlan.id} />
            )
          ) : (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">No hay plan de mantenimiento asociado.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
