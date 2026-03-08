'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { usePlans } from '@/hooks/use-plans';
import { PageHeader } from '@/components/page-header';
import { PageTransition } from '@/components/ui/page-transition';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ClipboardList, Home, ListChecks } from 'lucide-react';
import { ErrorState } from '@/components/error-state';
import { EmptyState } from '@/components/empty-state';
import {
  PLAN_STATUS_LABELS,
  PLAN_STATUS_VARIANT,
  PlanStatus,
  formatRelativeDate,
} from '@epde/shared';
import type { PlanListItem } from '@epde/shared';

function PlanCard({ plan, onClick }: { plan: PlanListItem; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="bg-card hover:bg-muted/40 w-full rounded-lg border p-4 text-left transition-colors"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <span className="leading-tight font-medium">{plan.name}</span>
        <Badge variant={PLAN_STATUS_VARIANT[plan.status] ?? 'secondary'} className="shrink-0">
          {PLAN_STATUS_LABELS[plan.status] ?? plan.status}
        </Badge>
      </div>

      <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <span className="flex items-center gap-1">
          <Home className="h-3.5 w-3.5" />
          {plan.property.address}, {plan.property.city}
        </span>
        <span className="flex items-center gap-1">
          <ListChecks className="h-3.5 w-3.5" />
          {plan.property ? `${plan._count.tasks} tarea${plan._count.tasks !== 1 ? 's' : ''}` : ''}
        </span>
        <span className="text-muted-foreground/60 text-xs">
          {formatRelativeDate(new Date(plan.createdAt))}
        </span>
      </div>
    </button>
  );
}

function PlanCardSkeleton() {
  return (
    <div className="bg-card rounded-lg border p-4">
      <div className="mb-2 flex items-start justify-between">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}

export default function MaintenancePlansPage() {
  const router = useRouter();
  const { data: plans, isLoading, isError, refetch } = usePlans();

  const grouped = useMemo(() => {
    if (!plans) return { active: [], draft: [], archived: [] };
    return {
      active: plans.filter((p) => p.status === PlanStatus.ACTIVE),
      draft: plans.filter((p) => p.status === PlanStatus.DRAFT),
      archived: plans.filter((p) => p.status === PlanStatus.ARCHIVED),
    };
  }, [plans]);

  return (
    <PageTransition>
      <PageHeader
        title="Planes de Mantenimiento"
        description="Todos los planes de mantenimiento preventivo de tus propiedades."
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <PlanCardSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          message="No se pudieron cargar los planes"
          onRetry={refetch}
          className="justify-center py-24"
        />
      ) : !plans || plans.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Sin planes todavía"
          message="Los planes de mantenimiento se crean automáticamente al agregar una propiedad."
        />
      ) : (
        <div className="space-y-6">
          {grouped.active.length > 0 && (
            <section>
              <h2 className="text-muted-foreground mb-2 text-sm font-medium tracking-wide uppercase">
                Activos ({grouped.active.length})
              </h2>
              <div className="space-y-2">
                {grouped.active.map((plan) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    onClick={() => router.push(`/properties/${plan.property.id}`)}
                  />
                ))}
              </div>
            </section>
          )}

          {grouped.draft.length > 0 && (
            <section>
              <h2 className="text-muted-foreground mb-2 text-sm font-medium tracking-wide uppercase">
                Borrador ({grouped.draft.length})
              </h2>
              <div className="space-y-2">
                {grouped.draft.map((plan) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    onClick={() => router.push(`/properties/${plan.property.id}`)}
                  />
                ))}
              </div>
            </section>
          )}

          {grouped.archived.length > 0 && (
            <section>
              <h2 className="text-muted-foreground mb-2 text-sm font-medium tracking-wide uppercase">
                Archivados ({grouped.archived.length})
              </h2>
              <div className="space-y-2">
                {grouped.archived.map((plan) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    onClick={() => router.push(`/properties/${plan.property.id}`)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </PageTransition>
  );
}
