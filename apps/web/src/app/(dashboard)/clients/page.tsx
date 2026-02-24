'use client';

import { useState, useMemo } from 'react';
import { useClients, useDeleteClient } from '@/hooks/use-clients';
import { useDebounce } from '@/hooks/use-debounce';
import { PageHeader } from '@/components/page-header';
import { DataTable } from '@/components/data-table/data-table';
import { SearchInput } from '@/components/search-input';
import { FilterSelect } from '@/components/filter-select';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { USER_STATUS_LABELS } from '@epde/shared';
import { clientColumns } from './columns';
import { InviteClientDialog } from './invite-client-dialog';

const statusOptions = Object.entries(USER_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export default function ClientsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search);
  const deleteClient = useDeleteClient();

  const filters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      status: status === 'all' ? undefined : status,
    }),
    [debouncedSearch, status],
  );

  const { data, isLoading, hasNextPage, fetchNextPage } = useClients(filters);

  const allClients = useMemo(() => data?.pages.flatMap((p) => p.data) ?? [], [data]);
  const total = data?.pages[0]?.total;

  return (
    <div>
      <PageHeader
        title="Clientes"
        description="Gestión de clientes de la plataforma"
        action={
          <Button onClick={() => setInviteOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Invitar Cliente
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-3">
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

      <DataTable
        columns={clientColumns({ onDelete: setDeleteId })}
        data={allClients}
        isLoading={isLoading}
        hasMore={hasNextPage}
        onLoadMore={() => fetchNextPage()}
        total={total}
        emptyMessage="No se encontraron clientes"
      />

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
    </div>
  );
}
