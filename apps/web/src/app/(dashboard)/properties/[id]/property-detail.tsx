'use client';

import type { PropertyPublic } from '@epde/shared';
import { PROPERTY_TYPE_LABELS } from '@epde/shared';
import {
  ArrowLeft,
  Building,
  Calendar,
  ClipboardList,
  MapPin,
  Pencil,
  Ruler,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProperty } from '@/hooks/use-properties';

import { EditPropertyDialog } from './edit-property-dialog';
import { PlanEditor } from './plan-editor';
import { PlanViewer } from './plan-viewer';

interface PropertyDetailProps {
  id: string;
  isAdmin: boolean;
  initialData?: PropertyPublic;
}

export function PropertyDetail({ id, isAdmin, initialData }: PropertyDetailProps) {
  const { data } = useProperty(id, { initialData });
  const property = data;
  const [editOpen, setEditOpen] = useState(false);

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

      {isAdmin && (
        <EditPropertyDialog open={editOpen} onOpenChange={setEditOpen} property={property} />
      )}
    </div>
  );
}
