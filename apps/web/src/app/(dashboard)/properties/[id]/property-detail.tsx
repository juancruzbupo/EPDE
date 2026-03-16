'use client';

import type { PropertyPublic } from '@epde/shared';
import { PROPERTY_TYPE_LABELS } from '@epde/shared';
import {
  ArrowLeft,
  Building,
  Calendar,
  Camera,
  ClipboardList,
  DollarSign,
  MapPin,
  Pencil,
  Ruler,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { ErrorState } from '@/components/error-state';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProperty, usePropertyExpenses, usePropertyPhotos } from '@/hooks/use-properties';

import { EditPropertyDialog } from './edit-property-dialog';
import { PlanEditor } from './plan-editor';
import { PlanViewer } from './plan-viewer';

interface PropertyDetailProps {
  id: string;
  isAdmin: boolean;
  initialData?: PropertyPublic;
}

export function PropertyDetail({ id, isAdmin, initialData }: PropertyDetailProps) {
  const { data, isError, refetch } = useProperty(id, { initialData });
  const property = data;
  const [editOpen, setEditOpen] = useState(false);

  if (isError && !property) {
    return <ErrorState message="No se pudo cargar la propiedad" onRetry={refetch} />;
  }

  if (!property) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={property.address}
        description={`${property.city} — ${PROPERTY_TYPE_LABELS[property.type] ?? property.type}`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/properties">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver
              </Link>
            </Button>
            {isAdmin && (
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </Button>
            )}
          </div>
        }
      />

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Detalles</TabsTrigger>
          <TabsTrigger value="plan">Plan de Mantenimiento</TabsTrigger>
          <TabsTrigger value="expenses">Gastos</TabsTrigger>
          <TabsTrigger value="photos">Fotos</TabsTrigger>
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
                      <dd className="font-medium">
                        <Link
                          href={`/clients/${property.user.id}`}
                          className="text-primary hover:underline"
                        >
                          {property.user.name}
                        </Link>
                      </dd>
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

        <TabsContent value="expenses" className="mt-4">
          <PropertyExpensesTab propertyId={property.id} />
        </TabsContent>

        <TabsContent value="photos" className="mt-4">
          <PropertyPhotosTab propertyId={property.id} />
        </TabsContent>
      </Tabs>

      {isAdmin && (
        <EditPropertyDialog
          key={property.id}
          open={editOpen}
          onOpenChange={setEditOpen}
          property={property}
        />
      )}
    </div>
  );
}

// ─── Expenses Tab ───────────────────────────────────────

function PropertyExpensesTab({ propertyId }: { propertyId: string }) {
  const { data: expenses, isLoading, isError, refetch } = usePropertyExpenses(propertyId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-muted/40 h-10 animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <ErrorState message="No se pudieron cargar los gastos" onRetry={refetch} className="py-12" />
    );
  }

  if (!expenses || expenses.items.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-12">
          <DollarSign className="text-muted-foreground/50 h-8 w-8" />
          <p className="text-muted-foreground text-sm">
            No hay gastos registrados para esta propiedad.
          </p>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(amount);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="type-title-md">Historial de Gastos</CardTitle>
          <p className="type-body-sm text-muted-foreground mt-1">
            Total: {formatCurrency(expenses.totalCost)}
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="divide-y">
          {expenses.items.map((item) => (
            <div
              key={`${item.date}-${item.description}`}
              className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{item.description}</p>
                <p className="text-muted-foreground text-xs">
                  {item.category ?? 'Presupuesto'} ·{' '}
                  {new Date(item.date).toLocaleDateString('es-AR')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={item.type === 'task' ? 'secondary' : 'default'} className="text-xs">
                  {item.type === 'task' ? 'Tarea' : 'Presupuesto'}
                </Badge>
                <span className="text-sm font-medium tabular-nums">
                  {formatCurrency(item.amount)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Photos Tab ─────────────────────────────────────────

function PropertyPhotosTab({ propertyId }: { propertyId: string }) {
  const { data: photos, isLoading, isError, refetch } = usePropertyPhotos(propertyId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-muted/40 aspect-square animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <ErrorState message="No se pudieron cargar las fotos" onRetry={refetch} className="py-12" />
    );
  }

  if (!photos || photos.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-12">
          <Camera className="text-muted-foreground/50 h-8 w-8" />
          <p className="text-muted-foreground text-sm">
            No hay fotos registradas para esta propiedad.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="type-title-md">Galería de Fotos ({photos.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {photos.map((photo) => (
            <a
              key={`${photo.url}-${photo.date}`}
              href={photo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative aspect-square overflow-hidden rounded-lg border"
            >
              <img
                src={photo.url}
                alt={photo.description}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                <p className="truncate text-xs font-medium text-white">{photo.description}</p>
                <p className="text-xs text-white/70">
                  {photo.source === 'task' ? 'Tarea' : 'Solicitud'} ·{' '}
                  {new Date(photo.date).toLocaleDateString('es-AR')}
                </p>
              </div>
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
