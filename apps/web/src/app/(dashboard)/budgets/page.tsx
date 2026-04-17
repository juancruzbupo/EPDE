'use client';

import type { BudgetStatus } from '@epde/shared';
import {
  BUDGET_STATUS_LABELS,
  BUDGET_STATUS_VARIANT,
  formatARS,
  formatRelativeDate,
  UserRole,
} from '@epde/shared';
import { Clock, DollarSign, FileCheck, Plus, SlidersHorizontal, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';

import { DataTable } from '@/components/data-table/data-table';
import { ErrorState } from '@/components/error-state';
import { BudgetsListTour } from '@/components/onboarding-tour';
import { PageHeader } from '@/components/page-header';
import { BudgetInlineHelper } from '@/components/request-type-helper';
import { SearchInput } from '@/components/search-input';
import { SearchableFilterSelect } from '@/components/searchable-filter-select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageTransition } from '@/components/ui/page-transition';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useBudgets } from '@/hooks/use-budgets';
import { useDebounce } from '@/hooks/use-debounce';
import { useUrlFilters } from '@/hooks/use-url-filters';
import type { BudgetRequestPublic } from '@/lib/api/budgets';
import { ROUTES } from '@/lib/routes';
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
      className="bg-card hover:bg-muted/40 hover:border-border/80 w-full space-y-1 rounded-lg border p-3 text-left shadow-xs transition-all active:opacity-60"
    >
      <p className="text-sm leading-snug font-medium">
        {budget.title}{' '}
        <Badge
          variant={BUDGET_STATUS_VARIANT[budget.status] ?? 'secondary'}
          className="relative top-[-1px] ml-0.5 inline-flex text-xs"
        >
          {BUDGET_STATUS_LABELS[budget.status] ?? budget.status}
        </Badge>
      </p>
      <p className="text-muted-foreground text-xs leading-relaxed">
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

  const isAdmin = user?.role === UserRole.ADMIN;
  const budgetStats = useMemo(() => {
    if (!isAdmin || allBudgetsRaw.length === 0) return null;
    let pending = 0;
    let quoted = 0;
    let approved = 0;
    let totalQuoted = 0;
    for (const b of allBudgetsRaw) {
      if (b.status === 'PENDING') pending++;
      else if (b.status === 'QUOTED') quoted++;
      else if (b.status === 'APPROVED') approved++;
      if (b.response?.totalAmount) totalQuoted += Number(b.response.totalAmount);
    }
    return { pending, quoted, approved, totalQuoted };
  }, [allBudgetsRaw, isAdmin]);

  return (
    <PageTransition>
      <BudgetsListTour />
      <PageHeader
        title="Presupuestos"
        description="Gestión de presupuestos"
        help={{
          term: 'Presupuesto',
          body: (
            <>
              <p>
                Pedís un precio para una reparación específica que <strong>ya sabés</strong> que
                necesitás. Ejemplo: &quot;Las canaletas están rotas, ¿cuánto sale repararlas?&quot;
              </p>
              <p className="mt-1">
                Si tenés un problema pero no sabés qué hacer, usá{' '}
                <strong>Solicitud de Servicio</strong> en su lugar.
              </p>
            </>
          ),
        }}
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
        <BudgetInlineHelper />
      </div>

      {budgetStats && (
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card className={budgetStats.pending > 0 ? 'border-warning/30' : ''}>
            <CardContent className="flex items-center gap-3 p-4">
              <Clock className="text-warning h-5 w-5" />
              <div>
                <p className="text-2xl font-bold tabular-nums">{budgetStats.pending}</p>
                <p className="text-muted-foreground text-xs">Pendientes</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <FileCheck className="text-primary h-5 w-5" />
              <div>
                <p className="text-2xl font-bold tabular-nums">{budgetStats.quoted}</p>
                <p className="text-muted-foreground text-xs">Cotizados</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <FileCheck className="text-success h-5 w-5" />
              <div>
                <p className="text-2xl font-bold tabular-nums">{budgetStats.approved}</p>
                <p className="text-muted-foreground text-xs">Aprobados</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <DollarSign className="text-foreground h-5 w-5" />
              <div>
                <p className="text-lg font-bold tabular-nums">
                  {formatARS(budgetStats.totalQuoted)}
                </p>
                <p className="text-muted-foreground text-xs">Total cotizado</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="mb-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar por título..."
            className="w-full sm:w-auto sm:min-w-[320px] sm:flex-1"
          />

          <div className="flex items-center gap-2">
            <SlidersHorizontal className="text-muted-foreground hidden h-4 w-4 sm:block" />

            {propertyOptions.length > 1 && (
              <SearchableFilterSelect
                value={propertyFilter}
                onChange={setPropertyFilter}
                options={propertyOptions}
                placeholder="Propiedad"
              />
            )}

            <Select value={status} onValueChange={(v) => setStatus(v as BudgetStatus | 'all')}>
              <SelectTrigger
                className="h-9 w-full gap-1.5 text-sm sm:w-auto sm:min-w-[120px]"
                aria-label="Filtrar por estado"
              >
                <SelectValue>
                  {status === 'all'
                    ? 'Estado'
                    : (statusOptions.find((o) => o.value === status)?.label ?? status)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Active filter chips */}
        {(status !== 'all' || propertyFilter !== 'all') && (
          <div className="flex flex-wrap items-center gap-2">
            {status !== 'all' && (
              <Badge variant="secondary" className="gap-1 py-1 pr-1.5 pl-2.5 font-normal">
                {statusOptions.find((o) => o.value === status)?.label ?? status}
                <button
                  onClick={() => setStatus('all')}
                  className="text-muted-foreground hover:text-foreground rounded-full p-0.5 transition-colors"
                  aria-label="Quitar filtro de estado"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {propertyFilter !== 'all' && (
              <Badge variant="secondary" className="gap-1 py-1 pr-1.5 pl-2.5 font-normal">
                {propertyOptions.find((o) => o.value === propertyFilter)?.label ?? 'Propiedad'}
                <button
                  onClick={() => setPropertyFilter('all')}
                  className="text-muted-foreground hover:text-foreground rounded-full p-0.5 transition-colors"
                  aria-label="Quitar filtro de propiedad"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStatus('all');
                setPropertyFilter('all');
                setSearch('');
              }}
              className="text-muted-foreground h-auto px-2 py-1 text-xs"
            >
              Limpiar todo
            </Button>
          </div>
        )}
      </div>

      {isError && (
        <ErrorState
          message="No se pudieron cargar los presupuestos"
          onRetry={refetch}
          className="justify-center py-24"
        />
      )}

      <p
        data-tour="budgets-table"
        className="type-label-sm text-muted-foreground mb-2 tracking-wider uppercase"
      >
        {total !== undefined
          ? `${total} presupuesto${total !== 1 ? 's' : ''} encontrado${total !== 1 ? 's' : ''}`
          : '\u00A0'}
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
                onClick={() => router.push(ROUTES.budget(b.id))}
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
          onRowClick={(row: BudgetRequestPublic) => router.push(ROUTES.budget(row.id))}
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
