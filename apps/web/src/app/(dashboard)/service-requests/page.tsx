'use client';

import type { ServiceStatus, ServiceUrgency } from '@epde/shared';
import { SERVICE_STATUS_LABELS, SERVICE_URGENCY_LABELS, UserRole } from '@epde/shared';
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
import { useDebounce } from '@/hooks/use-debounce';
import { useServiceRequests } from '@/hooks/use-service-requests';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { useAuthStore } from '@/stores/auth-store';

import { serviceRequestColumns } from './columns';
import { CreateServiceDialog } from './create-service-dialog';

const statusOptions = Object.entries(SERVICE_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}));

const urgencyOptions = Object.entries(SERVICE_URGENCY_LABELS).map(([value, label]) => ({
  value,
  label,
}));

function ServiceRequestsPageContent() {
  const router = useRouter();
  const [urlParams, setUrlParams] = useUrlFilters();
  const user = useAuthStore((s) => s.user);

  const [search, setSearch] = useState(urlParams.get('search') ?? '');
  const [status, setStatus] = useState<ServiceStatus | 'all'>(
    (urlParams.get('status') as ServiceStatus) || 'all',
  );
  const [urgency, setUrgency] = useState<ServiceUrgency | 'all'>(
    (urlParams.get('urgency') as ServiceUrgency) || 'all',
  );
  const [createOpen, setCreateOpen] = useState(false);

  const debouncedSearch = useDebounce(search);

  // Sync state to URL when filters change
  useEffect(() => {
    setUrlParams({ search: debouncedSearch, status, urgency });
  }, [debouncedSearch, status, urgency, setUrlParams]);

  const filters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      status: status === 'all' ? undefined : (status as ServiceStatus),
      urgency: urgency === 'all' ? undefined : (urgency as ServiceUrgency),
    }),
    [debouncedSearch, status, urgency],
  );

  const { data, isLoading, isError, refetch, hasNextPage, fetchNextPage } =
    useServiceRequests(filters);

  const allRequests = useMemo(() => data?.pages.flatMap((p) => p.data) ?? [], [data]);
  const total = data?.pages[0]?.total;

  return (
    <PageTransition>
      <PageHeader
        title="Solicitudes de Servicio"
        description="Gestión de solicitudes de servicio"
        action={
          user?.role === UserRole.CLIENT ? (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Solicitud
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
          onChange={(v: string) => setStatus(v as ServiceStatus | 'all')}
          options={statusOptions}
          placeholder="Estado"
        />
        <FilterSelect
          value={urgency}
          onChange={(v: string) => setUrgency(v as ServiceUrgency | 'all')}
          options={urgencyOptions}
          placeholder="Urgencia"
        />
      </div>

      {isError && (
        <ErrorState
          message="No se pudieron cargar las solicitudes"
          onRetry={refetch}
          className="justify-center py-24"
        />
      )}

      <DataTable
        columns={serviceRequestColumns}
        data={allRequests}
        isLoading={isLoading}
        hasMore={hasNextPage}
        onLoadMore={() => fetchNextPage()}
        total={total}
        emptyMessage="No se encontraron solicitudes de servicio"
        onRowClick={(row) => router.push(`/service-requests/${row.id}`)}
      />

      {user?.role === UserRole.CLIENT && (
        <CreateServiceDialog open={createOpen} onOpenChange={setCreateOpen} />
      )}
    </PageTransition>
  );
}

export default function ServiceRequestsPage() {
  return (
    <Suspense fallback={<div className="text-muted-foreground py-24 text-center">Cargando...</div>}>
      <ServiceRequestsPageContent />
    </Suspense>
  );
}
