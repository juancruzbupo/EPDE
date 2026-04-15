'use client';

import type { PropertyPublic, PropertySector } from '@epde/shared';
import { PROPERTY_TYPE_LABELS } from '@epde/shared';
import { ArrowLeft, Check, ClipboardList, Copy, Pencil } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { ErrorState } from '@/components/error-state';
import { PropertyTour } from '@/components/onboarding-tour';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SkeletonShimmer } from '@/components/ui/skeleton-shimmer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProperty, usePropertyProblems } from '@/hooks/use-properties';
import { ROUTES } from '@/lib/routes';

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
  const [addressCopied, setAddressCopied] = useState(false);
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
      <div className="no-print space-y-1">
        <Link
          href={ROUTES.properties}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Propiedades
        </Link>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="type-display-sm text-foreground tracking-tight">{property.address}</h1>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(property.address);
                  toast.success('Dirección copiada');
                  setAddressCopied(true);
                  setTimeout(() => setAddressCopied(false), 1500);
                }}
                className="text-muted-foreground hover:text-foreground shrink-0 transition-colors"
                aria-label="Copiar dirección"
              >
                {addressCopied ? (
                  <Check className="text-success h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="type-body-md text-muted-foreground mt-0.5">
              {[
                property.city,
                PROPERTY_TYPE_LABELS[property.type] ?? property.type,
                property.yearBuilt && `${property.yearBuilt}`,
                property.squareMeters && `${property.squareMeters} m²`,
                property.user && `Cliente: ${property.user.name}`,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/properties/${id}/report`}>Informe</Link>
            </Button>
            {isAdmin && (
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                <Pencil className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
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
                  {isAdmin
                    ? 'No hay plan de mantenimiento todavía. Para crear uno, completá la inspección en la pestaña "Inspección" y después hacé click en "Generar Plan".'
                    : 'La arquitecta está preparando tu plan de mantenimiento. Aparecerá acá cuando la inspección esté completa. Te notificaremos cuando esté listo.'}
                </p>
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
