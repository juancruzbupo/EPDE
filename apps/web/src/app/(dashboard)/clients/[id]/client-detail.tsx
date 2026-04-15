'use client';

import type { ClientPublic, UpdateClientInput } from '@epde/shared';
import { ArrowLeft, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { ConfirmDialog } from '@/components/confirm-dialog';
import { ErrorState } from '@/components/error-state';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { useClient, useDeleteClient, useUpdateClient } from '@/hooks/use-clients';
import { ROUTES } from '@/lib/routes';

import { ClientBudgetsSection } from './components/client-budgets-section';
import { ClientInfoCard } from './components/client-info-card';
import { ClientPropertiesSection } from './components/client-properties-section';
import { ClientReferralsSection } from './components/client-referrals-section';
import { ClientServiceRequestsSection } from './components/client-service-requests-section';
import { SubscriptionCard } from './components/subscription-card';

interface ClientDetailProps {
  id: string;
  initialData?: ClientPublic;
}

export function ClientDetail({ id, initialData }: ClientDetailProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useClient(id, { initialData });
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();

  const client = data;

  const onSubmit = (formData: UpdateClientInput) => {
    updateClient.mutate({ id, ...formData }, { onSuccess: () => setEditing(false) });
  };

  if (isError && !client)
    return (
      <ErrorState message="No se pudo cargar el cliente" onRetry={refetch} className="py-24" />
    );
  if (isLoading && !client) {
    return (
      <div className="space-y-4">
        <div className="bg-muted/40 h-8 w-48 animate-pulse rounded" />
        <div className="bg-muted/40 h-64 animate-pulse rounded-xl" />
      </div>
    );
  }
  if (!client) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={client.name}
        description={client.email}
        action={
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={ROUTES.clients}>
                <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
                Volver
              </Link>
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
              Eliminar
            </Button>
          </div>
        }
      />

      <ClientInfoCard
        client={client}
        editing={editing}
        onEdit={() => setEditing(true)}
        onCancelEdit={() => setEditing(false)}
        onSubmit={onSubmit}
        isPending={updateClient.isPending}
      />

      <SubscriptionCard client={client} clientId={client.id} />

      <ClientReferralsSection clientId={client.id} clientName={client.name} />

      <ClientPropertiesSection clientId={client.id} />

      <ClientBudgetsSection clientId={client.id} clientName={client.name} />

      <ClientServiceRequestsSection clientId={client.id} clientName={client.name} />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Eliminar cliente"
        description="¿Estás seguro? Esta acción no se puede deshacer."
        onConfirm={() =>
          deleteClient.mutate(id, {
            onSuccess: () => router.push(ROUTES.clients),
          })
        }
        isLoading={deleteClient.isPending}
      />
    </div>
  );
}
