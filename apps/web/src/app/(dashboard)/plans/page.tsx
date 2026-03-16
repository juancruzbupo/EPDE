'use client';

import type { PlanListItem } from '@epde/shared';
import { PLAN_STATUS_LABELS, PLAN_STATUS_VARIANT, PlanStatus } from '@epde/shared';
import { ChevronDown, ChevronRight, ClipboardList, Home, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { PageTransition } from '@/components/ui/page-transition';
import { Skeleton } from '@/components/ui/skeleton';
import { usePlans } from '@/hooks/use-plans';

/** Display order: actionable first, archived last. */
const STATUS_ORDER: PlanStatus[] = [PlanStatus.ACTIVE, PlanStatus.DRAFT, PlanStatus.ARCHIVED];

function PlanCard({ plan, onClick }: { plan: PlanListItem; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="bg-card hover:bg-muted/40 w-full rounded-lg border p-3 text-left transition-colors"
    >
      <div className="mb-1 flex items-start justify-between gap-2">
        <span className="text-sm leading-tight font-medium">{plan.name}</span>
        <Badge variant={PLAN_STATUS_VARIANT[plan.status] ?? 'secondary'} className="text-xs">
          {PLAN_STATUS_LABELS[plan.status] ?? plan.status}
        </Badge>
      </div>

      <div className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
        <span className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {plan.property.address}, {plan.property.city}
        </span>
        <span className="text-muted-foreground/40">·</span>
        <span className="flex items-center gap-1">
          <ClipboardList className="h-3 w-3" />
          {plan._count.tasks} tarea{plan._count.tasks !== 1 ? 's' : ''}
        </span>
      </div>
    </button>
  );
}

function PlanCardSkeleton() {
  return (
    <div className="bg-card rounded-lg border p-3">
      <div className="mb-1 flex items-start justify-between">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

function StatusSection({
  status,
  plans,
  defaultOpen,
  onPlanClick,
}: {
  status: PlanStatus;
  plans: PlanListItem[];
  defaultOpen: boolean;
  onPlanClick: (plan: PlanListItem) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);

  if (plans.length === 0) return null;

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="focus-visible:ring-ring/50 mb-2 flex w-full items-center gap-2 rounded py-1 text-left focus-visible:ring-[3px] focus-visible:outline-none"
      >
        {open ? (
          <ChevronDown className="text-muted-foreground h-4 w-4" />
        ) : (
          <ChevronRight className="text-muted-foreground h-4 w-4" />
        )}
        <span className="text-sm font-medium">{PLAN_STATUS_LABELS[status]}</span>
        <span className="text-muted-foreground text-sm">({plans.length})</span>
      </button>
      {open && (
        <div className="space-y-1.5 pl-6">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} onClick={() => onPlanClick(plan)} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function PlansPage() {
  const router = useRouter();
  const { data: plans, isLoading, isError, refetch } = usePlans();

  const grouped = useMemo(() => {
    const map = new Map<PlanStatus, PlanListItem[]>();
    for (const s of STATUS_ORDER) map.set(s, []);
    for (const plan of plans ?? []) {
      map.get(plan.status)?.push(plan);
    }
    return map;
  }, [plans]);

  const handlePlanClick = (plan: PlanListItem) => {
    router.push(`/properties/${plan.property.id}`);
  };

  return (
    <PageTransition>
      <PageHeader
        title="Planes de Mantenimiento"
        description="Todos los planes de mantenimiento de tus propiedades."
      />

      {isLoading ? (
        <div className="space-y-1.5">
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
          icon={Home}
          title="Sin planes"
          message="No hay planes de mantenimiento registrados todavia."
        />
      ) : (
        <div className="space-y-4">
          <p className="text-muted-foreground text-sm">
            {plans.length} plan{plans.length !== 1 ? 'es' : ''}
          </p>
          {STATUS_ORDER.map((status) => (
            <StatusSection
              key={status}
              status={status}
              plans={grouped.get(status) ?? []}
              defaultOpen={status !== PlanStatus.ARCHIVED}
              onPlanClick={handlePlanClick}
            />
          ))}
        </div>
      )}
    </PageTransition>
  );
}
