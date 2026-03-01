'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateClientSchema, type UpdateClientInput, USER_STATUS_LABELS } from '@epde/shared';
import type { ClientPublic, ApiResponse } from '@epde/shared';
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
import { ArrowLeft, Trash2, User as UserIcon, Mail, Phone, Calendar } from 'lucide-react';
import Link from 'next/link';

interface ClientDetailProps {
  id: string;
  initialData?: ApiResponse<ClientPublic>;
}

export function ClientDetail({ id, initialData }: ClientDetailProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data } = useClient(id, { initialData });
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

  if (!client) return null;

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
