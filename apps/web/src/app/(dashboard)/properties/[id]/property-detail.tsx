'use client';

import type { PropertyPublic, PropertySector } from '@epde/shared';
import { PROPERTY_TYPE_LABELS } from '@epde/shared';
import { ArrowLeft, ClipboardList, Pencil } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { Breadcrumbs } from '@/components/breadcrumbs';
import { ErrorState } from '@/components/error-state';
import { PropertyTour } from '@/components/onboarding-tour';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SkeletonShimmer } from '@/components/ui/skeleton-shimmer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProperty, usePropertyProblems } from '@/hooks/use-properties';

import { EditPropertyDialog } from './edit-property-dialog';
import { InspectionTab } from './inspection-tab';
import { PlanEditor } from './plan-editor';
import { PlanViewer } from './plan-viewer';
import { PropertyExpensesTab } from './property-expenses-tab';
import { PropertyHealthTab } from './property-health-tab';
import { PropertyPhotosTab } from './property-photos-tab';

interface PropertyDetailProps {
  id: string;
  isAdmin: boolean;
  initialData?: PropertyPublic;
}

export function PropertyDetail({ id, isAdmin, initialData }: PropertyDetailProps) {
  const { data, isLoading, isError, refetch } = useProperty(id, { initialData });
  const property = data;
  const { data: problemsCount } = usePropertyProblems(id);
  const [editOpen, setEditOpen] = useState(false);
  const [highlightTaskId, setHighlightTaskId] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(
    searchParams.get('tab') ?? (isAdmin ? 'plan' : 'health'),
  );

  if (isError && !property) {
    return <ErrorState message="No se pudo cargar la propiedad" onRetry={refetch} />;
  }

  if (isLoading && !property) {
    return (
      <div className="space-y-6">
        <SkeletonShimmer className="h-10 w-64" />
        <Card>
          <CardContent className="p-6">
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonShimmer key={i} className="h-6 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!property) return null;

  return (
    <div className="space-y-6">
      <div className="no-print">
        <Breadcrumbs
          items={[{ label: 'Propiedades', href: '/properties' }, { label: property.address }]}
        />
        <PageHeader
          title={property.address}
          description={[
            property.city,
            PROPERTY_TYPE_LABELS[property.type] ?? property.type,
            property.yearBuilt && `${property.yearBuilt}`,
            property.squareMeters && `${property.squareMeters} m²`,
            property.user && `Cliente: ${property.user.name}`,
          ]
            .filter(Boolean)
            .join(' · ')}
          action={
            <div className="no-print flex gap-2">
              <Button variant="outline" asChild>
                <Link href="/properties">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/properties/${id}/report`}>Ver Informe</Link>
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
      </div>

      <PropertyTour />
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList data-tour="property-tabs">
          <TabsTrigger value="health">
            Salud{problemsCount && problemsCount.length > 0 ? ` (${problemsCount.length})` : ''}
          </TabsTrigger>
          <TabsTrigger value="plan">Plan</TabsTrigger>
          <TabsTrigger value="expenses">Gastos</TabsTrigger>
          <TabsTrigger value="photos">Fotos</TabsTrigger>
          {isAdmin && <TabsTrigger value="inspection">Inspección</TabsTrigger>}
        </TabsList>

        <TabsContent value="plan" className="mt-4">
          {property.maintenancePlan ? (
            isAdmin ? (
              <PlanEditor
                propertyId={property.id}
                planId={property.maintenancePlan.id}
                activeSectors={property.activeSectors}
              />
            ) : (
              <PlanViewer
                planId={property.maintenancePlan.id}
                propertyId={property.id}
                highlightTaskId={highlightTaskId}
              />
            )
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center gap-2 py-12">
                <ClipboardList className="text-muted-foreground/60 h-8 w-8" />
                <p className="text-muted-foreground text-sm">
                  No hay plan de mantenimiento todavía.
                </p>
                {isAdmin && (
                  <p className="text-muted-foreground text-xs">
                    Para crear uno, completá la inspección en la pestaña &quot;Inspección&quot; y
                    después hacé click en &quot;Generar Plan&quot;.
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="expenses" className="mt-4">
          {activeTab === 'expenses' && <PropertyExpensesTab propertyId={property.id} />}
        </TabsContent>

        <TabsContent value="photos" className="mt-4">
          {activeTab === 'photos' && <PropertyPhotosTab propertyId={property.id} />}
        </TabsContent>

        {isAdmin && (
          <TabsContent value="inspection" className="mt-4">
            {activeTab === 'inspection' && (
              <InspectionTab
                propertyId={property.id}
                activeSectors={(property.activeSectors ?? []) as PropertySector[]}
                hasPlan={!!property.maintenancePlan}
              />
            )}
          </TabsContent>
        )}

        <TabsContent value="health" className="mt-4">
          {activeTab === 'health' && (
            <PropertyHealthTab
              propertyId={property.id}
              address={property.address}
              onNavigateToTask={(taskId) => {
                setHighlightTaskId(taskId);
                setActiveTab('plan');
              }}
            />
          )}
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
