'use client';

import type { BudgetStatus } from '@epde/shared';
import {
  BUDGET_STATUS_LABELS,
  BUDGET_STATUS_VARIANT,
  formatRelativeDate,
  UserRole,
} from '@epde/shared';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';

import { DataTable } from '@/components/data-table/data-table';
import { ErrorState } from '@/components/error-state';
import { FilterSelect } from '@/components/filter-select';
import { BudgetsListTour } from '@/components/onboarding-tour';
import { PageHeader } from '@/components/page-header';
import { RequestTypeInlineHelper } from '@/components/request-type-helper';
import { SearchInput } from '@/components/search-input';
import { SearchableFilterSelect } from '@/components/searchable-filter-select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageTransition } from '@/components/ui/page-transition';
import { useBudgets } from '@/hooks/use-budgets';
import { useDebounce } from '@/hooks/use-debounce';
import { useUrlFilters } from '@/hooks/use-url-filters';
import type { BudgetRequestPublic } from '@/lib/api/budgets';
import { useAuthStore } from '@/stores/auth-store';

import { budgetColumns } from './columns';
import { CreateBudgetDialog } from './create-budget-dialog';

function BudgetMobileCard({
  budget,
  onClick,
}: {
  budget: BudgetRequestPublic;
  onClick: () => void;
}) {
  const amount = budget.response
    ? new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(
        Number(budget.response.totalAmount),
      )
    : null;

  return (
    <button
      onClick={onClick}
      className="bg-card hover:bg-muted/40 w-full rounded-lg border p-3 text-left transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 flex-1 text-sm font-medium">{budget.title}</p>
        <Badge
          variant={BUDGET_STATUS_VARIANT[budget.status] ?? 'secondary'}
          className="shrink-0 text-xs"
        >
          {BUDGET_STATUS_LABELS[budget.status] ?? budget.status}
        </Badge>
      </div>
      <p className="text-muted-foreground mt-0.5 text-xs">
        {budget.property.address}
        {amount && ` · ${amount}`}
        {' · '}
        {formatRelativeDate(new Date(budget.createdAt))}
      </p>
    </button>
  );
}

const statusOptions = Object.entries(BUDGET_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}));

function BudgetsPageContent() {
  useEffect(() => {
    document.title = 'Presupuestos | EPDE';
  }, []);
  const router = useRouter();
  const [urlParams, setUrlParams] = useUrlFilters();
  const user = useAuthStore((s) => s.user);

  const [search, setSearch] = useState(urlParams.get('search') ?? '');
  const [status, setStatus] = useState<BudgetStatus | 'all'>(
    (urlParams.get('status') as BudgetStatus) || 'all',
  );
  const [propertyFilter, setPropertyFilter] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);

  const debouncedSearch = useDebounce(search);

  // Sync state to URL when filters change
  useEffect(() => {
    setUrlParams({ search: debouncedSearch, status });
  }, [debouncedSearch, status, setUrlParams]);

  const filters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      status: status === 'all' ? undefined : (status as BudgetStatus),
    }),
    [debouncedSearch, status],
  );

  const { data, isLoading, isError, refetch, hasNextPage, fetchNextPage } = useBudgets(filters);

  const allBudgetsRaw = useMemo(() => data?.pages.flatMap((p) => p.data) ?? [], [data]);

  const propertyOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const b of allBudgetsRaw) {
      if (!seen.has(b.propertyId)) seen.set(b.propertyId, b.property.address);
    }
    return [...seen.entries()].map(([id, address]) => ({ value: id, label: address }));
  }, [allBudgetsRaw]);

  const allBudgets = useMemo(() => {
    if (propertyFilter === 'all') return allBudgetsRaw;
    return allBudgetsRaw.filter((b) => b.propertyId === propertyFilter);
  }, [allBudgetsRaw, propertyFilter]);

  const total = data?.pages[0]?.total;

  return (
    <PageTransition>
      <BudgetsListTour />
      <PageHeader
        title="Presupuestos"
        description="Gestión de presupuestos"
        action={
          user?.role === UserRole.CLIENT ? (
            <Button data-tour="budgets-action" onClick={() => setCreateOpen(true)} size="sm">
              <Plus className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Solicitar Presupuesto</span>
            </Button>
          ) : undefined
        }
      />

      <div className="mb-3">
        <RequestTypeInlineHelper />
      </div>
      <div className="mb-4 flex flex-wrap gap-3">
        {propertyOptions.length > 1 && (
          <SearchableFilterSelect
            value={propertyFilter}
            onChange={setPropertyFilter}
            options={propertyOptions}
            placeholder="Propiedad"
          />
        )}
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar por título..." />
        <FilterSelect
          value={status}
          onChange={(v: string) => setStatus(v as BudgetStatus | 'all')}
          options={statusOptions}
          placeholder="Estado"
        />
      </div>

      {isError && (
        <ErrorState
          message="No se pudieron cargar los presupuestos"
          onRetry={refetch}
          className="justify-center py-24"
        />
      )}

      <p data-tour="budgets-table" className="text-muted-foreground mb-2 text-sm">
        {total !== undefined ? `${total} presupuesto${total !== 1 ? 's' : ''}` : '\u00A0'}
      </p>

      {/* Mobile: cards */}
      <div className="sm:hidden">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-card h-16 animate-pulse rounded-lg border" />
            ))}
          </div>
        ) : allBudgets.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">
            Todavía no tenés presupuestos.
          </p>
        ) : (
          <div className="space-y-2">
            {allBudgets.map((b) => (
              <BudgetMobileCard
                key={b.id}
                budget={b}
                onClick={() => router.push(`/budgets/${b.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Desktop: table */}
      <div className="hidden sm:block">
        <DataTable
          columns={budgetColumns}
          data={allBudgets}
          isLoading={isLoading}
          hasMore={hasNextPage}
          onLoadMore={() => fetchNextPage()}
          total={total}
          emptyMessage="Todavía no tenés presupuestos. Cuando necesites una reparación, pedí una cotización desde el botón 'Solicitar Presupuesto'."
          hasActiveFilters={debouncedSearch !== '' || status !== 'all' || propertyFilter !== 'all'}
          onRowClick={(row: BudgetRequestPublic) => router.push(`/budgets/${row.id}`)}
        />
      </div>

      <CreateBudgetDialog open={createOpen} onOpenChange={setCreateOpen} />
    </PageTransition>
  );
}

export default function BudgetsPage() {
  return (
    <Suspense fallback={<div className="text-muted-foreground py-24 text-center">Cargando...</div>}>
      <BudgetsPageContent />
    </Suspense>
  );
}
