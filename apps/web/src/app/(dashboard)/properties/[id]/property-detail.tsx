'use client';

import type { PropertyPublic, PropertySector } from '@epde/shared';
import { PROPERTY_TYPE_LABELS } from '@epde/shared';
import { ArrowLeft, Check, ClipboardList, Copy, Pencil, Shield } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { ErrorState } from '@/components/error-state';
import { PropertyTour } from '@/components/onboarding-tour';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SkeletonShimmer } from '@/components/ui/skeleton-shimmer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProperty, usePropertyHealthIndex, usePropertyProblems } from '@/hooks/use-properties';
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
  const { data: healthIndex } = usePropertyHealthIndex(id);

  const certEligibility = useMemo(() => {
    if (!property?.maintenancePlan) return { eligible: false as const, reason: 'no-plan' as const };
    const planCreated = new Date(property.maintenancePlan.createdAt);
    const oneYearLater = new Date(planCreated);
    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
    const now = new Date();
    if (now < oneYearLater) {
      return {
        eligible: false as const,
        reason: 'time' as const,
        eligibleDate: oneYearLater,
        monthsRemaining: Math.ceil(
          (oneYearLater.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30),
        ),
      };
    }
    if ((healthIndex?.score ?? 0) < 60) {
      return { eligible: false as const, reason: 'isv' as const, score: healthIndex?.score ?? 0 };
    }
    return { eligible: true as const };
  }, [property?.maintenancePlan, healthIndex?.score]);

  const [editOpen, setEditOpen] = useState(false);
  const [highlightTaskId, setHighlightTaskId] = useState<string | null>(null);
  const [addressCopied, setAddressCopied] = useState(false);
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(
    searchParams.get('tab') ?? (isAdmin ? 'plan' : 'health'),
  );

  if (isError && !property) {
    return (
      <ErrorState message="No se pudo cargar la propiedad" onRetry={refetch} severity="critical" />
    );
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
            {certEligibility.eligible && (
              <Button variant="outline" size="sm" asChild data-tour="certificate-btn">
                <Link href={ROUTES.propertyCertificate(id)}>
                  <Shield className="mr-1.5 h-4 w-4" />
                  Certificado
                </Link>
              </Button>
            )}
            <Button variant="outline" size="sm" asChild>
              <Link href={ROUTES.propertyReport(id)}>Informe</Link>
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

      {!isAdmin && property.maintenancePlan && !certEligibility.eligible && (
        <div className="bg-muted/30 border-border flex items-start gap-3 rounded-lg border p-4">
          <Shield className="text-muted-foreground mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="type-body-sm text-foreground font-medium">
              Certificado de Mantenimiento Preventivo
            </p>
            {certEligibility.reason === 'time' && (
              <p className="text-muted-foreground type-body-sm mt-1">
                Tu vivienda necesita al menos <strong>1 año de mantenimiento continuo</strong> para
                obtener el certificado.{' '}
                {certEligibility.monthsRemaining <= 3
                  ? `¡Falta poco! Disponible en ${certEligibility.eligibleDate.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}.`
                  : `Disponible a partir de ${certEligibility.eligibleDate.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}.`}
              </p>
            )}
            {certEligibility.reason === 'isv' && (
              <p className="text-muted-foreground type-body-sm mt-1">
                El certificado requiere un <strong>ISV de al menos 60</strong> (tu puntaje actual es{' '}
                {certEligibility.score}). Completá las tareas pendientes para mejorar tu puntaje.
              </p>
            )}
            <p className="text-muted-foreground mt-2 text-xs italic">
              El certificado deja constancia de las tareas de mantenimiento ejecutadas sobre tu
              vivienda, emitido bajo dirección profesional de la arquitecta responsable. Útil como
              historial documentado al mostrarla a compradores o inmobiliarias. No reemplaza
              certificados oficiales requeridos por bancos, aseguradoras o escribanías.
            </p>
          </div>
        </div>
      )}

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
