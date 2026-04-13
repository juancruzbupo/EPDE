'use client';

import type { UserStatus } from '@epde/shared';
import { CLIENT_STATUS_VARIANT, formatRelativeDate, USER_STATUS_LABELS } from '@epde/shared';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { ConfirmDialog } from '@/components/confirm-dialog';
import { DataTable } from '@/components/data-table/data-table';
import { ErrorState } from '@/components/error-state';
import { FilterSelect } from '@/components/filter-select';
import { ClientsTour } from '@/components/onboarding-tour';
import { PageHeader } from '@/components/page-header';
import { SearchInput } from '@/components/search-input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageTransition } from '@/components/ui/page-transition';
import { useClients, useDeleteClient, useReinviteClient } from '@/hooks/use-clients';
import { useDebounce } from '@/hooks/use-debounce';
import { useUrlFilters } from '@/hooks/use-url-filters';
import type { ClientPublic } from '@/lib/api/clients';

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
      className="bg-card hover:bg-muted/40 w-full rounded-lg border p-3 text-left transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{client.name}</p>
          <p className="text-muted-foreground truncate text-xs">
            {client.email}
            {propCount != null && ` · ${propCount} prop.`}
          </p>
        </div>
        <Badge
          variant={CLIENT_STATUS_VARIANT[client.status] ?? 'secondary'}
          className="shrink-0 text-xs"
        >
          {USER_STATUS_LABELS[client.status] ?? client.status}
        </Badge>
      </div>
      {client.lastLoginAt && (
        <p className="text-muted-foreground mt-1 text-xs">
          Último acceso: {formatRelativeDate(new Date(client.lastLoginAt))}
        </p>
      )}
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

      <div data-tour="clients-list" className="mb-4 flex flex-wrap gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar por nombre o email..."
        />
        <FilterSelect
          value={status}
          onChange={setStatus}
          options={statusOptions}
          placeholder="Estado"
        />
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
                onClick={() => router.push(`/clients/${c.id}`)}
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
          onRowClick={(row) => router.push(`/clients/${row.id}`)}
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
