'use client';

import type { BudgetStatus } from '@epde/shared';
import { BUDGET_STATUS_LABELS, UserRole } from '@epde/shared';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { DataTable } from '@/components/data-table/data-table';
import { ErrorState } from '@/components/error-state';
import { FilterSelect } from '@/components/filter-select';
import { PageHeader } from '@/components/page-header';
import { SearchInput } from '@/components/search-input';
import { Button } from '@/components/ui/button';
import { PageTransition } from '@/components/ui/page-transition';
import { useBudgets } from '@/hooks/use-budgets';
import { useDebounce } from '@/hooks/use-debounce';
import type { BudgetRequestPublic } from '@/lib/api/budgets';
import { useAuthStore } from '@/stores/auth-store';

import { budgetColumns } from './columns';
import { CreateBudgetDialog } from './create-budget-dialog';

const statusOptions = Object.entries(BUDGET_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export default function BudgetsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);

  const debouncedSearch = useDebounce(search);

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
          onChange={setStatus}
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
