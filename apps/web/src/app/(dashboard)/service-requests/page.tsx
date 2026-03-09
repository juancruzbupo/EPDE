'use client';

import type { ServiceStatus, ServiceUrgency } from '@epde/shared';
import { SERVICE_STATUS_LABELS, SERVICE_URGENCY_LABELS, UserRole } from '@epde/shared';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { DataTable } from '@/components/data-table/data-table';
import { ErrorState } from '@/components/error-state';
import { FilterSelect } from '@/components/filter-select';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { PageTransition } from '@/components/ui/page-transition';
import { useServiceRequests } from '@/hooks/use-service-requests';
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

export default function ServiceRequestsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [status, setStatus] = useState('all');
  const [urgency, setUrgency] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);

  const filters = useMemo(
    () => ({
      status: status === 'all' ? undefined : (status as ServiceStatus),
      urgency: urgency === 'all' ? undefined : (urgency as ServiceUrgency),
    }),
    [status, urgency],
  );

  const { data, isLoading, isError, refetch, hasNextPage, fetchNextPage } =
    useServiceRequests(filters);

  const allRequests = useMemo(() => data?.pages.flatMap((p) => p.data) ?? [], [data]);
  const total = data?.pages[0]?.total;

  return (
    <PageTransition>
      <PageHeader
        title="Solicitudes de Servicio"
        description="Gestion de solicitudes de servicio"
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
        <FilterSelect
          value={status}
          onChange={setStatus}
          options={statusOptions}
          placeholder="Estado"
        />
        <FilterSelect
          value={urgency}
          onChange={setUrgency}
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
