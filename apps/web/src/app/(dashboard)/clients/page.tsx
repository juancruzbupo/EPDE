'use client';

import type { UserStatus } from '@epde/shared';
import { CLIENT_STATUS_VARIANT, formatRelativeDate, USER_STATUS_LABELS } from '@epde/shared';
import { Plus, SlidersHorizontal, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { ConfirmDialog } from '@/components/confirm-dialog';
import { DataTable } from '@/components/data-table/data-table';
import { ErrorState } from '@/components/error-state';
import { ClientsTour } from '@/components/onboarding-tour';
import { PageHeader } from '@/components/page-header';
import { SearchInput } from '@/components/search-input';
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
import { useClients, useDeleteClient, useReinviteClient } from '@/hooks/use-clients';
import { useDebounce } from '@/hooks/use-debounce';
import { useUrlFilters } from '@/hooks/use-url-filters';
import type { ClientPublic } from '@/lib/api/clients';
import { ROUTES } from '@/lib/routes';

import { clientColumns } from './columns';
import { InviteClientDialog } from './invite-client-dialog';

function ClientMobileCard({
  client,
  onClick,
}: {
  client: ClientPublic & { _count?: { properties: number } };
  onClick: () => void;
}) {
  const propCount = client._count?.properties;
  return (
    <button
      onClick={onClick}
      className="bg-card hover:bg-muted/40 hover:border-border/80 w-full space-y-1 rounded-lg border p-3 text-left shadow-xs transition-all active:opacity-60"
    >
      <p className="text-sm leading-snug font-medium">
        {client.name}{' '}
        <Badge
          variant={CLIENT_STATUS_VARIANT[client.status] ?? 'secondary'}
          className="relative top-[-1px] ml-0.5 inline-flex text-xs"
        >
          {USER_STATUS_LABELS[client.status] ?? client.status}
        </Badge>
      </p>
      <p className="text-muted-foreground truncate text-xs leading-relaxed">
        {client.email}
        {propCount != null && ` · ${propCount} prop.`}
        {client.lastLoginAt &&
          ` · Último acceso: ${formatRelativeDate(new Date(client.lastLoginAt))}`}
      </p>
    </button>
  );
}

const statusOptions = Object.entries(USER_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export default function ClientsPage() {
  useEffect(() => {
    document.title = 'Clientes | EPDE';
  }, []);

  const router = useRouter();
  const [urlParams, setUrlParams] = useUrlFilters();
  const [search, setSearch] = useState(urlParams.get('search') ?? '');
  const [status, setStatus] = useState(urlParams.get('status') ?? 'all');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search);

  useEffect(() => {
    setUrlParams({ search: debouncedSearch, status });
  }, [debouncedSearch, status, setUrlParams]);
  const deleteClient = useDeleteClient();
  const reinviteClient = useReinviteClient();

  const filters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      status: status === 'all' ? undefined : (status as UserStatus),
    }),
    [debouncedSearch, status],
  );

  const { data, isLoading, isError, refetch, hasNextPage, fetchNextPage } = useClients(filters);

  const allClients = useMemo(() => data?.pages.flatMap((p) => p.data) ?? [], [data]);
  const total = data?.pages[0]?.total;

  return (
    <PageTransition>
      <ClientsTour />
      <PageHeader
        title="Clientes"
        description="Gestión de clientes de la plataforma"
        action={
          <Button data-tour="clients-invite" onClick={() => setInviteOpen(true)}>
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Invitar Cliente</span>
          </Button>
        }
      />

      <div data-tour="clients-list" className="mb-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar por nombre o email..."
            className="w-full sm:w-auto sm:min-w-[320px] sm:flex-1"
          />
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="text-muted-foreground hidden h-4 w-4 sm:block" />
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger
                className="h-9 w-auto min-w-[140px] gap-1.5 text-sm"
                aria-label="Filtrar por estado"
              >
                <SelectValue placeholder="Estado" />
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

        {status !== 'all' && (
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="gap-1 py-1 pr-1.5 pl-2.5 font-normal">
              Estado: {USER_STATUS_LABELS[status as UserStatus] ?? status}
              <button
                onClick={() => setStatus('all')}
                className="text-muted-foreground hover:text-foreground rounded-full p-0.5 transition-colors"
                aria-label="Quitar filtro de estado"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStatus('all');
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
          message="No se pudieron cargar los clientes"
          onRetry={refetch}
          className="justify-center py-24"
        />
      )}

      {/* Mobile: cards — Desktop: table */}
      <div className="sm:hidden">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-card h-20 animate-pulse rounded-lg border" />
            ))}
          </div>
        ) : allClients.length === 0 ? (
          <p className="text-muted-foreground py-12 text-center text-sm">
            No se encontraron clientes
          </p>
        ) : (
          <div className="space-y-2">
            {allClients.map((c) => (
              <ClientMobileCard
                key={c.id}
                client={c as ClientPublic & { _count?: { properties: number } }}
                onClick={() => router.push(ROUTES.client(c.id))}
              />
            ))}
          </div>
        )}
      </div>
      <div className="hidden sm:block">
        <DataTable
          columns={clientColumns({
            onDelete: setDeleteId,
            onReinvite: (id) => reinviteClient.mutate(id),
          })}
          data={allClients}
          isLoading={isLoading}
          hasMore={hasNextPage}
          onLoadMore={() => fetchNextPage()}
          total={total}
          emptyMessage="No se encontraron clientes"
          onRowClick={(row) => router.push(ROUTES.client(row.id))}
        />
      </div>

      <InviteClientDialog open={inviteOpen} onOpenChange={setInviteOpen} />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Eliminar cliente"
        description="¿Estás seguro de que querés eliminar este cliente? Esta acción no se puede deshacer."
        onConfirm={() => {
          if (deleteId) {
            deleteClient.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
          }
        }}
        isLoading={deleteClient.isPending}
      />
    </PageTransition>
  );
}
