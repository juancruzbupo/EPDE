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
import { AlertTriangle, Clock, Inbox, Plus, SlidersHorizontal, X } from 'lucide-react';
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
import { Card, CardContent } from '@/components/ui/card';
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
import { ROUTES } from '@/lib/routes';
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
  const isUrgent = request.urgency === 'URGENT' || request.urgency === 'HIGH';

  return (
    <button
      onClick={onClick}
      className={`bg-card hover:bg-muted/40 hover:border-border/80 w-full space-y-1 rounded-lg border p-3 text-left shadow-xs transition-all active:opacity-60 ${
        isUrgent ? 'border-l-destructive border-l-4' : ''
      }`}
    >
      <p className="text-sm leading-snug font-medium">
        {request.title}{' '}
        <Badge
          variant={SERVICE_STATUS_VARIANT[request.status] ?? 'secondary'}
          className="relative top-[-1px] ml-0.5 inline-flex text-xs"
        >
          {SERVICE_STATUS_LABELS[request.status] ?? request.status}
        </Badge>
      </p>
      <p className="text-muted-foreground text-xs leading-relaxed">
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

  const isAdmin = user?.role === UserRole.ADMIN;

  const allRequests = useMemo(() => {
    let result =
      propertyFilter === 'all'
        ? allRequestsRaw
        : allRequestsRaw.filter((r) => r.propertyId === propertyFilter);
    if (isAdmin) {
      const urgencyOrder: Record<string, number> = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      result = [...result].sort(
        (a, b) => (urgencyOrder[a.urgency] ?? 9) - (urgencyOrder[b.urgency] ?? 9),
      );
    }
    return result;
  }, [allRequestsRaw, propertyFilter, isAdmin]);

  const total = data?.pages[0]?.total;

  const srStats = useMemo(() => {
    if (!isAdmin || allRequestsRaw.length === 0) return null;
    let open = 0;
    let urgent = 0;
    let inProgress = 0;
    for (const r of allRequestsRaw) {
      if (r.status === 'OPEN' || r.status === 'IN_REVIEW') open++;
      if (r.urgency === 'URGENT' || r.urgency === 'HIGH') urgent++;
      if (r.status === 'IN_PROGRESS') inProgress++;
    }
    if (open === 0 && urgent === 0 && inProgress === 0) return null;
    return { open, urgent, inProgress };
  }, [allRequestsRaw, isAdmin]);

  return (
    <PageTransition>
      <ServicesListTour />
      <PageHeader
        title="Solicitudes de Servicio"
        description="Problemas detectados que EPDE evalúa y resuelve."
        help={{
          term: 'Solicitud de Servicio',
          body: (
            <>
              <p>
                Reportás un problema para que EPDE lo evalúe y te diga qué hacer. Ejemplo: &quot;Hay
                humedad en la pared, no sé qué es&quot;.
              </p>
              <p className="mt-1">
                Si ya sabés qué reparación necesitás y solo querés un precio, usá{' '}
                <strong>Presupuesto</strong> en su lugar.
              </p>
            </>
          ),
        }}
        action={
          user?.role === UserRole.CLIENT ? (
            <Button data-tour="services-action" onClick={() => setCreateOpen(true)} size="sm">
              <Plus className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Nueva Solicitud</span>
            </Button>
          ) : undefined
        }
      />

      {!isAdmin && (
        <div className="mb-3">
          <ServiceRequestInlineHelper />
        </div>
      )}

      {srStats && (
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Card className={srStats.open > 0 ? 'border-warning/30' : ''}>
            <CardContent className="flex items-center gap-3 p-4">
              <Inbox className="text-warning h-5 w-5" />
              <div>
                <p className="text-2xl font-bold tabular-nums">{srStats.open}</p>
                <p className="text-muted-foreground text-xs">Abiertas</p>
              </div>
            </CardContent>
          </Card>
          <Card className={srStats.urgent > 0 ? 'border-destructive/30' : ''}>
            <CardContent className="flex items-center gap-3 p-4">
              <AlertTriangle className="text-destructive h-5 w-5" />
              <div>
                <p className="text-2xl font-bold tabular-nums">{srStats.urgent}</p>
                <p className="text-muted-foreground text-xs">Urgentes / Altas</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <Clock className="text-primary h-5 w-5" />
              <div>
                <p className="text-2xl font-bold tabular-nums">{srStats.inProgress}</p>
                <p className="text-muted-foreground text-xs">En curso</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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

            <Select value={urgency} onValueChange={(v) => setUrgency(v as ServiceUrgency | 'all')}>
              <SelectTrigger
                className="h-9 w-full gap-1.5 text-sm sm:w-auto sm:min-w-[120px]"
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
                onClick={() => router.push(ROUTES.serviceRequest(r.id))}
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
          onRowClick={(row) => router.push(ROUTES.serviceRequest(row.id))}
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
