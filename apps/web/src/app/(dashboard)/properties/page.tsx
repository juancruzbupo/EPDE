'use client';

import type { PropertyType } from '@epde/shared';
import {
  PLAN_STATUS_LABELS,
  PLAN_STATUS_VARIANT,
  PROPERTY_TYPE_LABELS,
  QUERY_KEYS,
  UserRole,
} from '@epde/shared';
import { useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { DataTable } from '@/components/data-table/data-table';
import { ErrorState } from '@/components/error-state';
import { FilterSelect } from '@/components/filter-select';
import { PropertiesListTour } from '@/components/onboarding-tour';
import { PageHeader } from '@/components/page-header';
import { SearchInput } from '@/components/search-input';
import { SearchableFilterSelect } from '@/components/searchable-filter-select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageTransition } from '@/components/ui/page-transition';
import { useDebounce } from '@/hooks/use-debounce';
import { useProperties } from '@/hooks/use-properties';
import { useUrlFilters } from '@/hooks/use-url-filters';
import type { PropertyPublic } from '@/lib/api/properties';
import { getProperty } from '@/lib/api/properties';
import { useAuthStore } from '@/stores/auth-store';

import { propertyColumns } from './columns';
import { CreatePropertyDialog } from './create-property-dialog';

function PropertyMobileCard({
  property,
  onClick,
}: {
  property: PropertyPublic;
  onClick: () => void;
}) {
  const plan = property.maintenancePlan;
  const isv = property.latestISV;
  const isvVariant = isv
    ? isv.score >= 80
      ? 'success'
      : isv.score >= 60
        ? 'warning'
        : isv.score >= 40
          ? 'caution'
          : 'destructive'
    : undefined;

  return (
    <button
      onClick={onClick}
      className="bg-card hover:bg-muted/40 w-full rounded-lg border p-3 text-left transition-all hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{property.address}</p>
          <p className="text-muted-foreground text-xs">
            {property.city}
            {property.yearBuilt && ` · ${property.yearBuilt}`}
            {' · '}
            {PROPERTY_TYPE_LABELS[property.type] ?? property.type}
          </p>
        </div>
        {isv && isvVariant && (
          <Badge variant={isvVariant} className="shrink-0 text-xs">
            {isv.score}
          </Badge>
        )}
      </div>
      {plan && (
        <div className="mt-1.5 flex items-center gap-1.5">
          <Badge variant={PLAN_STATUS_VARIANT[plan.status] ?? 'secondary'} className="text-xs">
            {PLAN_STATUS_LABELS[plan.status] ?? plan.status}
          </Badge>
        </div>
      )}
    </button>
  );
}

const typeOptions = Object.entries(PROPERTY_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

const planStatusOptions = Object.entries(PLAN_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export default function PropertiesPage() {
  useEffect(() => {
    document.title = 'Propiedades | EPDE';
  }, []);

  const router = useRouter();
  const [urlParams, setUrlParams] = useUrlFilters();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === UserRole.ADMIN;

  const [search, setSearch] = useState(urlParams.get('search') ?? '');
  const [type, setType] = useState(urlParams.get('type') ?? 'all');
  const [clientFilter, setClientFilter] = useState('all');
  const [planStatus, setPlanStatus] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);

  const debouncedSearch = useDebounce(search);
  const columns = useMemo(() => propertyColumns({ isAdmin: !!isAdmin }), [isAdmin]);

  useEffect(() => {
    setUrlParams({ search: debouncedSearch, type });
  }, [debouncedSearch, type, setUrlParams]);

  const filters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      type: type === 'all' ? undefined : (type as PropertyType),
    }),
    [debouncedSearch, type],
  );

  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch, hasNextPage, fetchNextPage } = useProperties(filters);

  const handleRowHover = useCallback(
    (row: PropertyPublic) => {
      queryClient.prefetchQuery({
        queryKey: [QUERY_KEYS.properties, row.id],
        queryFn: () => getProperty(row.id).then((r) => r.data),
        staleTime: 30_000,
      });
    },
    [queryClient],
  );

  const allPropertiesRaw = useMemo(() => data?.pages.flatMap((p) => p.data) ?? [], [data]);

  // Derive client options from loaded data (admin only)
  const clientOptions = useMemo(() => {
    if (!isAdmin) return [];
    const seen = new Map<string, string>();
    for (const p of allPropertiesRaw) {
      if (p.user && !seen.has(p.user.id)) seen.set(p.user.id, p.user.name);
    }
    return [...seen.entries()].map(([id, name]) => ({ value: id, label: name }));
  }, [allPropertiesRaw, isAdmin]);

  // Client-side filtering for client + plan status
  const allProperties = useMemo(() => {
    let result = allPropertiesRaw;
    if (clientFilter !== 'all') {
      result = result.filter((p) => p.user?.id === clientFilter);
    }
    if (planStatus !== 'all') {
      result = result.filter((p) => p.maintenancePlan?.status === planStatus);
    }
    return result;
  }, [allPropertiesRaw, clientFilter, planStatus]);
  const total = data?.pages[0]?.total;

  return (
    <PageTransition>
      <PropertiesListTour />
      <PageHeader
        title="Propiedades"
        description="Gestión de propiedades"
        action={
          isAdmin ? (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Propiedad
            </Button>
          ) : undefined
        }
      />

      <div data-tour="properties-filters" className="mb-4 flex flex-wrap gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar por dirección o ciudad..."
        />
        <FilterSelect value={type} onChange={setType} options={typeOptions} placeholder="Tipo" />
        <FilterSelect
          value={planStatus}
          onChange={setPlanStatus}
          options={planStatusOptions}
          placeholder="Estado del plan"
        />
        {isAdmin && clientOptions.length > 1 && (
          <SearchableFilterSelect
            value={clientFilter}
            onChange={setClientFilter}
            options={clientOptions}
            placeholder="Cliente"
          />
        )}
      </div>

      {isError && (
        <ErrorState
          message="No se pudieron cargar las propiedades"
          onRetry={refetch}
          className="justify-center py-24"
        />
      )}

      <p data-tour="properties-table" className="text-muted-foreground mb-2 text-sm">
        {total !== undefined ? `${total} propiedad${total !== 1 ? 'es' : ''}` : '\u00A0'}
      </p>

      {/* Mobile: cards — Desktop: table */}
      <div className="sm:hidden">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-card h-20 animate-pulse rounded-lg border" />
            ))}
          </div>
        ) : allProperties.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">
            No se encontraron propiedades
          </p>
        ) : (
          <div className="space-y-2">
            {allProperties.map((p) => (
              <PropertyMobileCard
                key={p.id}
                property={p}
                onClick={() => router.push(`/properties/${p.id}`)}
              />
            ))}
          </div>
        )}
      </div>
      <div className="hidden sm:block">
        <DataTable
          columns={columns}
          data={allProperties}
          isLoading={isLoading}
          hasMore={hasNextPage}
          onLoadMore={() => fetchNextPage()}
          total={total}
          emptyMessage="No se encontraron propiedades"
          onRowClick={(row) => router.push(`/properties/${row.id}`)}
          onRowHover={handleRowHover}
        />
      </div>

      {isAdmin && <CreatePropertyDialog open={createOpen} onOpenChange={setCreateOpen} />}
    </PageTransition>
  );
}
