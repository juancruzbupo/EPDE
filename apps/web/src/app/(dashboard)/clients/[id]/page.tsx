'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateClientSchema, type UpdateClientInput, USER_STATUS_LABELS } from '@epde/shared';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useClient, useUpdateClient, useDeleteClient } from '@/hooks/use-clients';
import { PageHeader } from '@/components/page-header';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Trash2, User as UserIcon, Mail, Phone, Calendar } from 'lucide-react';
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
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <Skeleton className="h-7 w-56" />
            <Skeleton className="mt-1.5 h-4 w-36" />
          </div>
          <Skeleton className="h-9 w-24" />
        </div>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </CardHeader>
          <CardContent>
            <div className="bg-muted/40 rounded-lg p-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-1.5">
                    <Skeleton className="h-3.5 w-24" />
                    <Skeleton className="h-4 w-36" />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex flex-col items-center gap-2 py-16">
        <UserIcon className="text-muted-foreground/50 h-10 w-10" />
        <p className="text-muted-foreground text-sm">Cliente no encontrado</p>
        <Button variant="outline" asChild className="mt-2">
          <Link href="/clients">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a clientes
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
            <div className="bg-muted/40 rounded-lg p-4">
              <dl className="grid gap-4 text-sm sm:grid-cols-2">
                <div className="space-y-1">
                  <dt className="text-muted-foreground flex items-center gap-1.5">
                    <UserIcon className="h-3.5 w-3.5" />
                    Nombre
                  </dt>
                  <dd className="font-medium">{client.name}</dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-muted-foreground flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" />
                    Email
                  </dt>
                  <dd className="font-medium">{client.email}</dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-muted-foreground flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" />
                    Teléfono
                  </dt>
                  <dd className="font-medium">{client.phone || '—'}</dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    Fecha de creación
                  </dt>
                  <dd className="font-medium">
                    {formatDistanceToNow(new Date(client.createdAt), {
                      addSuffix: true,
                      locale: es,
                    })}
                  </dd>
                </div>
              </dl>
            </div>
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
