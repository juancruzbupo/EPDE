'use client';

import type { PlanListItem } from '@epde/shared';
import {
  PLAN_STATUS_HINTS,
  PLAN_STATUS_LABELS,
  PLAN_STATUS_VARIANT,
  PlanStatus,
  WHATSAPP_CONTACT_NUMBER,
} from '@epde/shared';
import { ChevronDown, ChevronRight, ClipboardList, Home, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';

import { ContextualEmptyState } from '@/components/contextual-empty-state';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { PlansListTour } from '@/components/onboarding-tour';
import { PageHeader } from '@/components/page-header';
import { SearchInput } from '@/components/search-input';
import { Badge } from '@/components/ui/badge';
import { PageTransition } from '@/components/ui/page-transition';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebounce } from '@/hooks/use-debounce';
import { usePlans } from '@/hooks/use-plans';

/** Display order: actionable first, archived last. */
const STATUS_ORDER: PlanStatus[] = [PlanStatus.ACTIVE, PlanStatus.DRAFT, PlanStatus.ARCHIVED];

function PlanCard({ plan, onClick }: { plan: PlanListItem; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="bg-card hover:bg-muted/40 w-full rounded-lg border p-3 text-left transition-all active:opacity-60"
    >
      <div className="mb-1 flex items-start justify-between gap-2">
        <span className="type-title-sm leading-tight">{plan.name}</span>
        <Badge
          variant={PLAN_STATUS_VARIANT[plan.status] ?? 'secondary'}
          className="text-xs"
          title={PLAN_STATUS_HINTS[plan.status]}
        >
          {PLAN_STATUS_LABELS[plan.status] ?? plan.status}
        </Badge>
      </div>

      <div className="text-muted-foreground type-body-sm flex flex-wrap items-center gap-x-2 gap-y-0.5">
        <span className="flex items-center gap-1">
          <MapPin className="h-3 w-3" aria-hidden="true" />
          {plan.property.address}, {plan.property.city}
        </span>
        <span className="text-muted-foreground/40">·</span>
        <span className="flex items-center gap-1">
          <ClipboardList className="h-3 w-3" aria-hidden="true" />
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
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="focus-visible:ring-ring/50 mb-2 flex w-full items-center gap-2 rounded py-1 text-left focus-visible:ring-[3px] focus-visible:outline-none"
      >
        {open ? (
          <ChevronDown className="text-muted-foreground h-4 w-4" aria-hidden="true" />
        ) : (
          <ChevronRight className="text-muted-foreground h-4 w-4" aria-hidden="true" />
        )}
        <span className="type-title-sm">{PLAN_STATUS_LABELS[status]}</span>
        <span className="text-muted-foreground type-body-md">({plans.length})</span>
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

function MaintenancePlansPageContent() {
  useEffect(() => {
    document.title = 'Planes | EPDE';
  }, []);

  const router = useRouter();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const { data: plans, isLoading, isError, refetch } = usePlans();

  const filtered = useMemo(() => {
    if (!plans) return [];
    if (!debouncedSearch) return plans;
    const q = debouncedSearch.toLowerCase();
    return plans.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.property.address.toLowerCase().includes(q) ||
        p.property.city.toLowerCase().includes(q),
    );
  }, [plans, debouncedSearch]);

  const grouped = useMemo(() => {
    const map = new Map<PlanStatus, PlanListItem[]>();
    for (const s of STATUS_ORDER) map.set(s, []);
    for (const plan of filtered) {
      map.get(plan.status)?.push(plan);
    }
    return map;
  }, [filtered]);

  const handlePlanClick = (plan: PlanListItem) => {
    router.push(`/properties/${plan.property.id}?tab=plan`);
  };

  return (
    <PageTransition>
      <PlansListTour />
      <PageHeader
        title="Planes de Mantenimiento"
        description="Todos los planes de mantenimiento de tus propiedades."
        help={{
          term: 'Plan de Mantenimiento',
          body: (
            <p>
              La lista de tareas programadas para cuidar tu casa, con fechas y prioridades. La
              arquitecta lo genera después de la inspección inicial. Cada propiedad tiene un plan
              propio.
            </p>
          ),
        }}
      />

      <div className="mb-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar plan, dirección o ciudad..."
        />
      </div>

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
      ) : !plans || filtered.length === 0 ? (
        debouncedSearch ? (
          <EmptyState
            icon={Home}
            title="Sin resultados"
            message="No se encontraron planes con esa búsqueda."
          />
        ) : (
          <ContextualEmptyState
            icon={Home}
            title="Todavía no tenés un plan activo"
            message="Tu plan de mantenimiento se crea después de la inspección inicial. Si querés coordinar la inspección, escribinos por WhatsApp."
            action={{
              label: 'Hablar por WhatsApp',
              onClick: () =>
                window.open(
                  `https://wa.me/${WHATSAPP_CONTACT_NUMBER}?text=${encodeURIComponent('Hola! Quiero coordinar la inspección inicial para tener mi plan de mantenimiento.')}`,
                  '_blank',
                  'noopener,noreferrer',
                ),
            }}
          />
        )
      ) : (
        <div data-tour="plans-list" className="space-y-4">
          <p className="text-muted-foreground type-body-md">
            {filtered.length} plan{filtered.length !== 1 ? 'es' : ''}
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

export default function MaintenancePlansPage() {
  return (
    <Suspense fallback={<div className="text-muted-foreground py-24 text-center">Cargando...</div>}>
      <MaintenancePlansPageContent />
    </Suspense>
  );
}
