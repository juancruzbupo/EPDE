'use client';

import type { ServiceStatus, ServiceUrgency } from '@epde/shared';
import {
  formatRelativeDate,
  SERVICE_STATUS_LABELS,
  SERVICE_STATUS_VARIANT,
  SERVICE_URGENCY_LABELS,
  URGENCY_VARIANT,
  UserRole,
} from '@epde/shared';
import { Plus, SlidersHorizontal, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';

import { DataTable } from '@/components/data-table/data-table';
import { ErrorState } from '@/components/error-state';
import { ServicesListTour } from '@/components/onboarding-tour';
import { PageHeader } from '@/components/page-header';
import { ServiceRequestInlineHelper } from '@/components/request-type-helper';
import { SearchInput } from '@/components/search-input';
import { SearchableFilterSelect } from '@/components/searchable-filter-select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageTransition } from '@/components/ui/page-transition';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDebounce } from '@/hooks/use-debounce';
import { useServiceRequests } from '@/hooks/use-service-requests';
import { useUrlFilters } from '@/hooks/use-url-filters';
import type { ServiceRequestPublic } from '@/lib/api/service-requests';
import { useAuthStore } from '@/stores/auth-store';

import { serviceRequestColumns } from './columns';
import { CreateServiceDialog } from './create-service-dialog';

function ServiceMobileCard({
  request,
  onClick,
}: {
  request: ServiceRequestPublic;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="bg-card hover:bg-muted/40 w-full rounded-lg border p-3 text-left transition-all hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 flex-1 text-sm font-medium">{request.title}</p>
        <Badge
          variant={SERVICE_STATUS_VARIANT[request.status] ?? 'secondary'}
          className="shrink-0 text-xs"
        >
          {SERVICE_STATUS_LABELS[request.status] ?? request.status}
        </Badge>
      </div>
      <p className="text-muted-foreground mt-0.5 text-xs">
        {request.property.address}
        {' · '}
        <Badge
          variant={URGENCY_VARIANT[request.urgency] ?? 'secondary'}
          className="inline-flex px-1.5 py-0 text-[10px]"
        >
          {SERVICE_URGENCY_LABELS[request.urgency] ?? request.urgency}
        </Badge>
        {' · '}
        {formatRelativeDate(new Date(request.createdAt))}
      </p>
    </button>
  );
}

const statusOptions = Object.entries(SERVICE_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}));

const urgencyOptions = Object.entries(SERVICE_URGENCY_LABELS).map(([value, label]) => ({
  value,
  label,
}));

function ServiceRequestsPageContent() {
  useEffect(() => {
    document.title = 'Solicitudes | EPDE';
  }, []);
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
  const [propertyFilter, setPropertyFilter] = useState('all');
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

  const allRequestsRaw = useMemo(() => data?.pages.flatMap((p) => p.data) ?? [], [data]);

  const propertyOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const r of allRequestsRaw) {
      if (!seen.has(r.propertyId)) seen.set(r.propertyId, r.property.address);
    }
    return [...seen.entries()].map(([id, address]) => ({ value: id, label: address }));
  }, [allRequestsRaw]);

  const allRequests = useMemo(() => {
    if (propertyFilter === 'all') return allRequestsRaw;
    return allRequestsRaw.filter((r) => r.propertyId === propertyFilter);
  }, [allRequestsRaw, propertyFilter]);

  const total = data?.pages[0]?.total;

  return (
    <PageTransition>
      <ServicesListTour />
      <PageHeader
        title="Solicitudes de Servicio"
        description="Gestión de solicitudes de servicio"
        action={
          user?.role === UserRole.CLIENT ? (
            <Button data-tour="services-action" onClick={() => setCreateOpen(true)} size="sm">
              <Plus className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Nueva Solicitud</span>
            </Button>
          ) : undefined
        }
      />

      <div className="mb-3">
        <ServiceRequestInlineHelper />
      </div>
      <div data-tour="services-filters" className="mb-4 space-y-3">
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

            <Select value={status} onValueChange={(v) => setStatus(v as ServiceStatus | 'all')}>
              <SelectTrigger
                className="h-9 w-auto min-w-[120px] gap-1.5 text-sm"
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

            <Select value={urgency} onValueChange={(v) => setUrgency(v as ServiceUrgency | 'all')}>
              <SelectTrigger
                className="h-9 w-auto min-w-[120px] gap-1.5 text-sm"
                aria-label="Filtrar por urgencia"
              >
                <SelectValue>
                  {urgency === 'all'
                    ? 'Urgencia'
                    : (urgencyOptions.find((o) => o.value === urgency)?.label ?? urgency)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toda urgencia</SelectItem>
                {urgencyOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Active filter chips */}
        {(status !== 'all' || urgency !== 'all' || propertyFilter !== 'all') && (
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
            {urgency !== 'all' && (
              <Badge variant="secondary" className="gap-1 py-1 pr-1.5 pl-2.5 font-normal">
                {urgencyOptions.find((o) => o.value === urgency)?.label ?? urgency}
                <button
                  onClick={() => setUrgency('all')}
                  className="text-muted-foreground hover:text-foreground rounded-full p-0.5 transition-colors"
                  aria-label="Quitar filtro de urgencia"
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
                setUrgency('all');
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
          message="No se pudieron cargar las solicitudes"
          onRetry={refetch}
          className="justify-center py-24"
        />
      )}

      {/* Mobile: cards */}
      <div className="sm:hidden">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-card h-16 animate-pulse rounded-lg border" />
            ))}
          </div>
        ) : allRequests.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">
            No se encontraron solicitudes.
          </p>
        ) : (
          <div className="space-y-2">
            {allRequests.map((r) => (
              <ServiceMobileCard
                key={r.id}
                request={r}
                onClick={() => router.push(`/service-requests/${r.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Desktop: table */}
      <div className="hidden sm:block">
        <DataTable
          columns={serviceRequestColumns}
          data={allRequests}
          isLoading={isLoading}
          hasMore={hasNextPage}
          onLoadMore={() => fetchNextPage()}
          total={total}
          emptyMessage="Si detectás un problema en tu casa, creá una solicitud y EPDE lo evalúa. Usá el botón 'Nueva Solicitud' o hacelo desde el detalle de una tarea."
          hasActiveFilters={
            debouncedSearch !== '' ||
            status !== 'all' ||
            urgency !== 'all' ||
            propertyFilter !== 'all'
          }
          onRowClick={(row) => router.push(`/service-requests/${row.id}`)}
        />
      </div>

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
