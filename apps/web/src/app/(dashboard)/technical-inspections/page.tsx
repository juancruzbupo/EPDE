'use client';

import type { TechnicalInspectionPublic, TechnicalInspectionStatus } from '@epde/shared';
import {
  formatARSCompact,
  formatRelativeDate,
  TECHNICAL_INSPECTION_STATUS_ENUM_LABELS,
  TECHNICAL_INSPECTION_TYPE_ENUM_LABELS,
  UserRole,
} from '@epde/shared';
import { ClipboardCheck, Plus } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';

import { ErrorState } from '@/components/error-state';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageTransition } from '@/components/ui/page-transition';
import { useTechnicalInspections } from '@/hooks/use-technical-inspections';
import { ROUTES } from '@/lib/routes';
import { useAuthStore } from '@/stores/auth-store';

import { CreateInspectionDialog } from './create-inspection-dialog';

const STATUS_VARIANT: Record<TechnicalInspectionStatus, 'default' | 'secondary' | 'destructive'> = {
  REQUESTED: 'secondary',
  SCHEDULED: 'secondary',
  IN_PROGRESS: 'default',
  REPORT_READY: 'default',
  PAID: 'default',
  CANCELED: 'destructive',
};

function InspectionCard({
  inspection,
  onClick,
  isAdmin,
}: {
  inspection: TechnicalInspectionPublic;
  onClick: () => void;
  isAdmin: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="bg-card hover:bg-muted/40 hover:border-border/80 w-full space-y-2 rounded-lg border p-4 text-left shadow-xs transition-all active:opacity-60"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-snug font-medium">
            {inspection.inspectionNumber} ·{' '}
            {TECHNICAL_INSPECTION_TYPE_ENUM_LABELS[inspection.type] ?? inspection.type}
          </p>
          <p className="text-muted-foreground mt-0.5 text-xs">
            {inspection.property?.address ?? '—'}
            {inspection.property?.city ? `, ${inspection.property.city}` : ''}
          </p>
          {isAdmin && inspection.requester && (
            <p className="text-muted-foreground text-xs">Cliente: {inspection.requester.name}</p>
          )}
        </div>
        <Badge variant={STATUS_VARIANT[inspection.status] ?? 'secondary'}>
          {TECHNICAL_INSPECTION_STATUS_ENUM_LABELS[inspection.status] ?? inspection.status}
        </Badge>
      </div>
      <div className="text-muted-foreground flex items-center justify-between text-xs">
        <span className="tabular-nums">{formatARSCompact(inspection.feeAmount)}</span>
        <span>{formatRelativeDate(new Date(inspection.createdAt))}</span>
      </div>
    </button>
  );
}

function TechnicalInspectionsPageContent() {
  useEffect(() => {
    document.title = 'Informes técnicos | EPDE';
  }, []);
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === UserRole.ADMIN;
  const isClient = user?.role === UserRole.CLIENT;

  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get('action') === 'create' && isClient) {
      setCreateOpen(true);
    }
  }, [searchParams, isClient]);

  const { data, isLoading, isError, refetch, hasNextPage, fetchNextPage } = useTechnicalInspections(
    {},
  );

  const inspections = useMemo(() => data?.pages.flatMap((p) => p.data) ?? [], [data]);
  const total = data?.pages[0]?.total;

  return (
    <PageTransition>
      <PageHeader
        title="Informes técnicos"
        description={
          isClient
            ? 'Informe profesional firmado por arquitecta matriculada. Servicio pago aparte del diagnóstico inicial del plan.'
            : 'Informes técnicos solicitados por clientes activos. Pagan al recibir el PDF firmado.'
        }
        action={
          isClient ? (
            <Button onClick={() => setCreateOpen(true)} size="sm">
              <Plus className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Solicitar informe</span>
            </Button>
          ) : undefined
        }
      />

      {isError && (
        <ErrorState
          message="No se pudieron cargar los informes"
          onRetry={refetch}
          className="justify-center py-24"
        />
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-card h-24 animate-pulse rounded-lg border" />
          ))}
        </div>
      ) : inspections.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <ClipboardCheck className="text-muted-foreground h-10 w-10" />
            <p className="text-sm font-medium">
              {isClient ? 'Todavía no solicitaste ningún informe' : 'Sin informes aún'}
            </p>
            {isClient && (
              <>
                <p className="text-muted-foreground max-w-md text-sm">
                  Si necesitás un informe técnico firmado para compraventa, herencias o problemas
                  puntuales, empezá desde acá.
                </p>
                <Button onClick={() => setCreateOpen(true)} size="sm">
                  <Plus className="mr-1.5 h-4 w-4" />
                  Solicitar informe
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {inspections.map((i) => (
            <InspectionCard
              key={i.id}
              inspection={i}
              isAdmin={isAdmin}
              onClick={() => router.push(ROUTES.technicalInspection(i.id))}
            />
          ))}
          {typeof total === 'number' && (
            <p className="text-muted-foreground pt-1 text-xs">
              {inspections.length} de {total}
            </p>
          )}
          {hasNextPage && (
            <div className="flex justify-center pt-2">
              <Button variant="outline" size="sm" onClick={() => fetchNextPage()}>
                Cargar más
              </Button>
            </div>
          )}
        </div>
      )}

      {isClient && <CreateInspectionDialog open={createOpen} onOpenChange={setCreateOpen} />}
    </PageTransition>
  );
}

export default function TechnicalInspectionsPage() {
  return (
    <Suspense fallback={<div className="text-muted-foreground py-24 text-center">Cargando...</div>}>
      <TechnicalInspectionsPageContent />
    </Suspense>
  );
}
