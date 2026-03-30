import type { ClientPublic } from '@epde/shared';
import {
  formatRelativeDate,
  type UpdateClientInput,
  updateClientSchema,
  USER_STATUS_LABELS,
} from '@epde/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { Calendar, Mail, Phone, User as UserIcon } from 'lucide-react';
import { memo } from 'react';
import { useForm } from 'react-hook-form';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ClientInfoCardProps {
  client: ClientPublic;
  editing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSubmit: (data: UpdateClientInput) => void;
  isPending: boolean;
}

export const ClientInfoCard = memo(function ClientInfoCard({
  client,
  editing,
  onEdit,
  onCancelEdit,
  onSubmit,
  isPending,
}: ClientInfoCardProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateClientInput>({
    resolver: zodResolver(updateClientSchema),
    values: { name: client.name, phone: client.phone ?? '' },
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Información del cliente</CardTitle>
        <div className="flex items-center gap-2">
          <Badge>{USER_STATUS_LABELS[client.status] ?? client.status}</Badge>
          {!editing && (
            <Button variant="outline" size="sm" onClick={onEdit}>
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
              <Input
                id="client-name"
                aria-describedby={errors.name ? 'client-name-error' : undefined}
                {...register('name')}
              />
              {errors.name && (
                <p id="client-name-error" role="alert" className="text-destructive text-sm">
                  {errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-phone">Teléfono</Label>
              <Input id="client-phone" {...register('phone')} />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Guardando...' : 'Guardar'}
              </Button>
              <Button type="button" variant="outline" onClick={onCancelEdit}>
                Cancelar
              </Button>
            </div>
          </form>
        ) : (
          <div className="bg-muted/40 rounded-lg p-4">
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <div className="space-y-1">
                <dt className="text-muted-foreground flex items-center gap-1.5">
                  <UserIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  Nombre
                </dt>
                <dd className="font-medium">{client.name}</dd>
              </div>
              <div className="space-y-1">
                <dt className="text-muted-foreground flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                  Email
                </dt>
                <dd className="font-medium">{client.email}</dd>
              </div>
              <div className="space-y-1">
                <dt className="text-muted-foreground flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                  Teléfono
                </dt>
                <dd className="font-medium">{client.phone || '—'}</dd>
              </div>
              <div className="space-y-1">
                <dt className="text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                  Fecha de creación
                </dt>
                <dd className="font-medium">{formatRelativeDate(new Date(client.createdAt))}</dd>
              </div>
              <div className="space-y-1">
                <dt className="text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                  Último acceso
                </dt>
                <dd className="font-medium">
                  {client.lastLoginAt ? formatRelativeDate(new Date(client.lastLoginAt)) : 'Nunca'}
                </dd>
              </div>
            </dl>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
