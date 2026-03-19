'use client';

import type { BudgetStatus } from '@epde/shared';
import { BUDGET_STATUS_LABELS, UserRole } from '@epde/shared';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';

import { DataTable } from '@/components/data-table/data-table';
import { ErrorState } from '@/components/error-state';
import { FilterSelect } from '@/components/filter-select';
import { PageHeader } from '@/components/page-header';
import { SearchInput } from '@/components/search-input';
import { Button } from '@/components/ui/button';
import { PageTransition } from '@/components/ui/page-transition';
import { useBudgets } from '@/hooks/use-budgets';
import { useDebounce } from '@/hooks/use-debounce';
import { useUrlFilters } from '@/hooks/use-url-filters';
import type { BudgetRequestPublic } from '@/lib/api/budgets';
import { useAuthStore } from '@/stores/auth-store';

import { budgetColumns } from './columns';
import { CreateBudgetDialog } from './create-budget-dialog';

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

  const allBudgets = useMemo(() => data?.pages.flatMap((p) => p.data) ?? [], [data]);
  const total = data?.pages[0]?.total;

  return (
    <PageTransition>
      <PageHeader
        title="Presupuestos"
        description="Gestión de presupuestos"
        action={
          user?.role === UserRole.CLIENT ? (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Solicitar Presupuesto
            </Button>
          ) : undefined
        }
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar por título o dirección..."
        />
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

      <DataTable
        columns={budgetColumns}
        data={allBudgets}
        isLoading={isLoading}
        hasMore={hasNextPage}
        onLoadMore={() => fetchNextPage()}
        total={total}
        emptyMessage="No se encontraron presupuestos"
        onRowClick={(row: BudgetRequestPublic) => router.push(`/budgets/${row.id}`)}
      />

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
