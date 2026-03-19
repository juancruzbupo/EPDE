'use client';

import type { PropertyType } from '@epde/shared';
import { PROPERTY_TYPE_LABELS, QUERY_KEYS, UserRole } from '@epde/shared';
import { useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { DataTable } from '@/components/data-table/data-table';
import { ErrorState } from '@/components/error-state';
import { FilterSelect } from '@/components/filter-select';
import { PageHeader } from '@/components/page-header';
import { SearchInput } from '@/components/search-input';
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

const typeOptions = Object.entries(PROPERTY_TYPE_LABELS).map(([value, label]) => ({
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
  const [createOpen, setCreateOpen] = useState(false);

  const debouncedSearch = useDebounce(search);

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

  const allProperties = useMemo(() => data?.pages.flatMap((p) => p.data) ?? [], [data]);
  const total = data?.pages[0]?.total;

  return (
    <PageTransition>
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

      <div className="mb-4 flex flex-wrap gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar por dirección o ciudad..."
        />
        <FilterSelect value={type} onChange={setType} options={typeOptions} placeholder="Tipo" />
      </div>

      {isError && (
        <ErrorState
          message="No se pudieron cargar las propiedades"
          onRetry={refetch}
          className="justify-center py-24"
        />
      )}

      <DataTable
        columns={propertyColumns({ isAdmin: !!isAdmin })}
        data={allProperties}
        isLoading={isLoading}
        hasMore={hasNextPage}
        onLoadMore={() => fetchNextPage()}
        total={total}
        emptyMessage="No se encontraron propiedades"
        onRowClick={(row) => router.push(`/properties/${row.id}`)}
        onRowHover={handleRowHover}
      />

      {isAdmin && <CreatePropertyDialog open={createOpen} onOpenChange={setCreateOpen} />}
    </PageTransition>
  );
}
