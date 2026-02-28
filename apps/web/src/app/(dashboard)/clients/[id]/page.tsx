'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateClientSchema, type UpdateClientInput, USER_STATUS_LABELS } from '@epde/shared';
import { useClient, useUpdateClient, useDeleteClient } from '@/hooks/use-clients';
import { PageHeader } from '@/components/page-header';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data, isLoading } = useClient(id);
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();

  const client = data?.data;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateClientInput>({
    resolver: zodResolver(updateClientSchema),
    values: client ? { name: client.name, phone: client.phone ?? '' } : undefined,
  });

  const onSubmit = (formData: UpdateClientInput) => {
    updateClient.mutate({ id, ...formData }, { onSuccess: () => setEditing(false) });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!client) {
    return <p className="text-muted-foreground">Cliente no encontrado</p>;
  }

  return (
    <div>
      <PageHeader
        title={client.name}
        description={client.email}
        action={
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/clients">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver
              </Link>
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </Button>
          </div>
        }
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Información del cliente</CardTitle>
          <div className="flex items-center gap-2">
            <Badge>{USER_STATUS_LABELS[client.status] ?? client.status}</Badge>
            {!editing && (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                Editar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editing ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="client-name">Nombre</Label>
                <Input id="client-name" {...register('name')} />
                {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="client-phone">Teléfono</Label>
                <Input id="client-phone" {...register('phone')} />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={updateClient.isPending}>
                  {updateClient.isPending ? 'Guardando...' : 'Guardar'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditing(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          ) : (
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground text-sm">Nombre</dt>
                <dd className="font-medium">{client.name}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-sm">Email</dt>
                <dd className="font-medium">{client.email}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-sm">Teléfono</dt>
                <dd className="font-medium">{client.phone || '—'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-sm">Fecha de creación</dt>
                <dd className="font-medium">
                  {new Date(client.createdAt).toLocaleDateString('es-AR')}
                </dd>
              </div>
            </dl>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Eliminar cliente"
        description="¿Estás seguro? Esta acción no se puede deshacer."
        onConfirm={() =>
          deleteClient.mutate(id, {
            onSuccess: () => router.push('/clients'),
          })
        }
        isLoading={deleteClient.isPending}
      />
    </div>
  );
}
