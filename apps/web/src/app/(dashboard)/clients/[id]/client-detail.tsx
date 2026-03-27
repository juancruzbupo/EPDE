'use client';

import type { ClientPublic } from '@epde/shared';
import {
  BUDGET_STATUS_LABELS,
  BUDGET_STATUS_VARIANT,
  formatRelativeDate,
  PLAN_STATUS_LABELS,
  PLAN_STATUS_VARIANT,
  SERVICE_STATUS_LABELS,
  SERVICE_STATUS_VARIANT,
  type UpdateClientInput,
  updateClientSchema,
  USER_STATUS_LABELS,
} from '@epde/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  Home,
  Mail,
  Phone,
  Trash2,
  User as UserIcon,
  Wrench,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { ConfirmDialog } from '@/components/confirm-dialog';
import { ErrorState } from '@/components/error-state';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useBudgets } from '@/hooks/use-budgets';
import { useClient, useDeleteClient, useUpdateClient } from '@/hooks/use-clients';
import { useProperties } from '@/hooks/use-properties';
import { useServiceRequests } from '@/hooks/use-service-requests';

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
              <Link href="/clients">
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
                    {client.lastLoginAt
                      ? formatRelativeDate(new Date(client.lastLoginAt))
                      : 'Nunca'}
                  </dd>
                </div>
              </dl>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Subscription Section ──────────────────────────── */}
      <SubscriptionCard client={client} clientId={client.id} />

      {/* ─── Properties Section ─────────────────────────────── */}
      <ClientPropertiesSection clientId={client.id} />

      {/* ─── Budgets Section ─────────────────────────────────── */}
      <ClientBudgetsSection clientId={client.id} clientName={client.name} />

      {/* ─── Service Requests Section ─────────────────────────── */}
      <ClientServiceRequestsSection clientId={client.id} clientName={client.name} />

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

// ─── Client Properties Section ─────────────────────────────

function ClientPropertiesSection({ clientId }: { clientId: string }) {
  const { data: propertiesData } = useProperties({ userId: clientId });
  const properties = propertiesData?.pages.flatMap((p) => p.data) ?? [];
  const displayProperties = properties.slice(0, 5);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Home className="h-4 w-4" aria-hidden="true" />
          Propiedades
          {properties.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {properties.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {displayProperties.length === 0 ? (
          <p className="text-muted-foreground text-sm">Sin propiedades</p>
        ) : (
          <ul className="divide-y">
            {displayProperties.map((prop) => (
              <li
                key={prop.id}
                className="flex items-center justify-between py-2 first:pt-0 last:pb-0"
              >
                <Link
                  href={`/properties/${prop.id}`}
                  className="text-sm font-medium hover:underline"
                >
                  {prop.address}, {prop.city}
                </Link>
                {prop.maintenancePlan ? (
                  <Badge variant={PLAN_STATUS_VARIANT[prop.maintenancePlan.status] ?? 'secondary'}>
                    {PLAN_STATUS_LABELS[prop.maintenancePlan.status] ?? prop.maintenancePlan.status}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground text-xs">Sin plan</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Client Budgets Section ─────────────────────────────

function ClientBudgetsSection({ clientId, clientName }: { clientId: string; clientName: string }) {
  const { data, isLoading } = useBudgets({ userId: clientId, take: 5 });
  const budgets = data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-4 w-4" aria-hidden="true" />
          Presupuestos
          {budgets.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {budgets.length}
            </Badge>
          )}
        </CardTitle>
        <Link
          href={`/budgets?search=${encodeURIComponent(clientName)}`}
          className="text-muted-foreground hover:text-foreground text-xs transition-colors"
        >
          Ver todos
        </Link>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : budgets.length === 0 ? (
          <p className="text-muted-foreground text-sm">Sin presupuestos</p>
        ) : (
          <ul className="divide-y">
            {budgets.map((b) => (
              <li
                key={b.id}
                className="flex items-center justify-between py-2 first:pt-0 last:pb-0"
              >
                <Link href={`/budgets/${b.id}`} className="text-sm font-medium hover:underline">
                  {b.title}
                </Link>
                <Badge variant={BUDGET_STATUS_VARIANT[b.status] ?? 'secondary'} className="text-xs">
                  {BUDGET_STATUS_LABELS[b.status] ?? b.status}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Client Service Requests Section ────────────────────

function ClientServiceRequestsSection({
  clientId,
  clientName,
}: {
  clientId: string;
  clientName: string;
}) {
  const { data, isLoading } = useServiceRequests({ userId: clientId, take: 5 });
  const requests = data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Wrench className="h-4 w-4" aria-hidden="true" />
          Solicitudes de Servicio
          {requests.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {requests.length}
            </Badge>
          )}
        </CardTitle>
        <Link
          href={`/service-requests?search=${encodeURIComponent(clientName)}`}
          className="text-muted-foreground hover:text-foreground text-xs transition-colors"
        >
          Ver todos
        </Link>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <p className="text-muted-foreground text-sm">Sin solicitudes</p>
        ) : (
          <ul className="divide-y">
            {requests.map((sr) => (
              <li
                key={sr.id}
                className="flex items-center justify-between py-2 first:pt-0 last:pb-0"
              >
                <Link
                  href={`/service-requests/${sr.id}`}
                  className="text-sm font-medium hover:underline"
                >
                  {sr.title}
                </Link>
                <Badge
                  variant={SERVICE_STATUS_VARIANT[sr.status] ?? 'secondary'}
                  className="text-xs"
                >
                  {SERVICE_STATUS_LABELS[sr.status] ?? sr.status}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Subscription Card ────────────────────────────────────

function SubscriptionCard({ client, clientId }: { client: ClientPublic; clientId: string }) {
  const updateClient = useUpdateClient();
  const [extending, setExtending] = useState(false);

  const { expiresAt, statusLabel, statusVariant } = useMemo(() => {
    const exp = client.subscriptionExpiresAt ? new Date(client.subscriptionExpiresAt) : null;
    const expired = exp ? exp.getTime() < Date.now() : false;
    const days = exp ? Math.ceil((exp.getTime() - Date.now()) / (24 * 60 * 60_000)) : null;

    let label: string;
    let variant: 'destructive' | 'secondary' | 'warning' | 'success';
    if (!exp) {
      label = 'Sin suscripción';
      variant = 'secondary';
    } else if (expired) {
      label = 'Expirada';
      variant = 'destructive';
    } else if (days !== null && days <= 7) {
      label = `Vence en ${days} día${days === 1 ? '' : 's'}`;
      variant = 'warning';
    } else {
      label = 'Activa';
      variant = 'success';
    }

    return {
      expiresAt: exp,
      isExpired: expired,
      daysLeft: days,
      statusLabel: label,
      statusVariant: variant,
    };
  }, [client.subscriptionExpiresAt]);

  const handleExtend = (days: number) => {
    setExtending(true);
    const baseDate = expiresAt && expiresAt > new Date() ? expiresAt : new Date();
    const newExpiry = new Date(baseDate.getTime() + days * 24 * 60 * 60_000);
    updateClient.mutate(
      { id: clientId, subscriptionExpiresAt: newExpiry },
      {
        onSuccess: () => {
          toast.success(`Suscripción extendida ${days} días`);
          setExtending(false);
        },
        onError: () => setExtending(false),
      },
    );
  };

  const handleRemove = () => {
    setExtending(true);
    updateClient.mutate(
      { id: clientId, subscriptionExpiresAt: null },
      {
        onSuccess: () => {
          toast.success('Suscripción removida');
          setExtending(false);
        },
        onError: () => setExtending(false),
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4" aria-hidden="true" />
            Suscripción
          </CardTitle>
          <Badge variant={statusVariant}>{statusLabel}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <dt className="text-muted-foreground">Activación</dt>
            <dd className="font-medium">
              {client.activatedAt
                ? formatRelativeDate(new Date(client.activatedAt))
                : 'No activado'}
            </dd>
          </div>
          <div className="space-y-1">
            <dt className="text-muted-foreground">Vencimiento</dt>
            <dd className="font-medium">
              {expiresAt ? expiresAt.toLocaleDateString('es-AR') : '—'}
            </dd>
          </div>
        </dl>
        <div className="mt-4 flex gap-2">
          <Button size="sm" variant="outline" onClick={() => handleExtend(30)} disabled={extending}>
            +30 días
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleExtend(60)} disabled={extending}>
            +60 días
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleExtend(365)}
            disabled={extending}
          >
            +1 año
          </Button>
          {expiresAt && (
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive/80"
              onClick={handleRemove}
              disabled={extending}
            >
              Quitar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
