'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { useProperties } from '@/hooks/use-properties';
import { useDebounce } from '@/hooks/use-debounce';
import { PageHeader } from '@/components/page-header';
import { DataTable } from '@/components/data-table/data-table';
import { SearchInput } from '@/components/search-input';
import { FilterSelect } from '@/components/filter-select';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { PROPERTY_TYPE_LABELS, UserRole } from '@epde/shared';
import { PageTransition } from '@/components/ui/page-transition';
import { propertyColumns } from './columns';
import { CreatePropertyDialog } from './create-property-dialog';

const typeOptions = Object.entries(PROPERTY_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export default function PropertiesPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === UserRole.ADMIN;

  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);

  const debouncedSearch = useDebounce(search);

  const filters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      type: type === 'all' ? undefined : type,
    }),
    [debouncedSearch, type],
  );

  const { data, isLoading, hasNextPage, fetchNextPage } = useProperties(filters);

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

      <DataTable
        columns={propertyColumns({ isAdmin: !!isAdmin })}
        data={allProperties}
        isLoading={isLoading}
        hasMore={hasNextPage}
        onLoadMore={() => fetchNextPage()}
        total={total}
        emptyMessage="No se encontraron propiedades"
        onRowClick={(row) => router.push(`/properties/${row.id}`)}
      />

      {isAdmin && <CreatePropertyDialog open={createOpen} onOpenChange={setCreateOpen} />}
    </PageTransition>
  );
}
