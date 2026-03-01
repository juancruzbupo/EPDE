'use client';

import { useParams } from 'next/navigation';
import { useProperty } from '@/hooks/use-properties';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  MapPin,
  Building,
  Calendar,
  Ruler,
  User,
  Home,
  ClipboardList,
} from 'lucide-react';
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
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <Skeleton className="h-7 w-56" />
            <Skeleton className="mt-1.5 h-4 w-36" />
          </div>
          <Skeleton className="h-9 w-24" />
        </div>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </CardHeader>
          <CardContent>
            <div className="bg-muted/40 rounded-lg p-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="space-y-1.5">
                    <Skeleton className="h-3.5 w-24" />
                    <Skeleton className="h-4 w-36" />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="flex flex-col items-center gap-2 py-16">
        <Home className="text-muted-foreground/50 h-10 w-10" />
        <p className="text-muted-foreground text-sm">Propiedad no encontrada</p>
        <Button variant="outline" asChild className="mt-2">
          <Link href="/properties">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a propiedades
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Información de la propiedad</CardTitle>
              <Badge variant="outline">
                {PROPERTY_TYPE_LABELS[property.type] ?? property.type}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/40 rounded-lg p-4">
                <dl className="grid gap-4 text-sm sm:grid-cols-2">
                  <div className="space-y-1">
                    <dt className="text-muted-foreground flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      Dirección
                    </dt>
                    <dd className="font-medium">{property.address}</dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="text-muted-foreground flex items-center gap-1.5">
                      <Building className="h-3.5 w-3.5" />
                      Ciudad
                    </dt>
                    <dd className="font-medium">{property.city}</dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      Año de construcción
                    </dt>
                    <dd className="font-medium">{property.yearBuilt ?? '—'}</dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="text-muted-foreground flex items-center gap-1.5">
                      <Ruler className="h-3.5 w-3.5" />
                      Metros cuadrados
                    </dt>
                    <dd className="font-medium">{property.squareMeters ?? '—'}</dd>
                  </div>
                  {property.user && (
                    <div className="space-y-1">
                      <dt className="text-muted-foreground flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5" />
                        Cliente
                      </dt>
                      <dd className="font-medium">{property.user.name}</dd>
                    </div>
                  )}
                </dl>
              </div>
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
              <CardContent className="flex flex-col items-center gap-2 py-12">
                <ClipboardList className="text-muted-foreground/50 h-8 w-8" />
                <p className="text-muted-foreground text-sm">
                  No hay plan de mantenimiento asociado.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
