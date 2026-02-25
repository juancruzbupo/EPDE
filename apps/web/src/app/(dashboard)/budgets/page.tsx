'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useBudgets } from '@/hooks/use-budgets';
import { useAuthStore } from '@/stores/auth-store';
import { PageHeader } from '@/components/page-header';
import { DataTable } from '@/components/data-table/data-table';
import { FilterSelect } from '@/components/filter-select';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { BUDGET_STATUS_LABELS, UserRole } from '@epde/shared';
import { budgetColumns } from './columns';
import { CreateBudgetDialog } from './create-budget-dialog';
import type { BudgetRequestPublic } from '@/lib/api/budgets';

const statusOptions = Object.entries(BUDGET_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export default function BudgetsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [status, setStatus] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);

  const filters = useMemo(
    () => ({
      status: status === 'all' ? undefined : status,
    }),
    [status],
  );

  const { data, isLoading, hasNextPage, fetchNextPage } = useBudgets(filters);

  const allBudgets = useMemo(() => data?.pages.flatMap((p) => p.data) ?? [], [data]);
  const total = data?.pages[0]?.total;

  return (
    <div>
      <PageHeader
        title="Presupuestos"
        description="Gestion de presupuestos"
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
        <FilterSelect
          value={status}
          onChange={setStatus}
          options={statusOptions}
          placeholder="Estado"
        />
      </div>

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
    </div>
  );
}
