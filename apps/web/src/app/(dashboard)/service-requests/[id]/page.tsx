'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useServiceRequest, useUpdateServiceStatus } from '@/hooks/use-service-requests';
import { PageHeader } from '@/components/page-header';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { SERVICE_URGENCY_LABELS, SERVICE_STATUS_LABELS, UserRole } from '@epde/shared';
import Link from 'next/link';
import { urgencyVariant } from '@/lib/style-maps';

const STATUS_TRANSITIONS: Record<string, string> = {
  OPEN: 'IN_REVIEW',
  IN_REVIEW: 'IN_PROGRESS',
  IN_PROGRESS: 'RESOLVED',
  RESOLVED: 'CLOSED',
};

const TRANSITION_LABELS: Record<string, string> = {
  IN_REVIEW: 'Pasar a En Revision',
  IN_PROGRESS: 'Pasar a En Progreso',
  RESOLVED: 'Marcar como Resuelto',
  CLOSED: 'Cerrar solicitud',
};

export default function ServiceRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === UserRole.ADMIN;

  const { data, isLoading } = useServiceRequest(id);
  const updateStatus = useUpdateServiceStatus();

  const [statusConfirm, setStatusConfirm] = useState<string | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  const request = data?.data;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!request) {
    return <p className="text-muted-foreground">Solicitud no encontrada</p>;
  }

  const nextStatus = STATUS_TRANSITIONS[request.status];

  return (
    <div>
      <PageHeader
        title={request.title}
        description={`Solicitud #${request.id.slice(0, 8)}`}
        action={
          <Button variant="outline" asChild>
            <Link href="/service-requests">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Link>
          </Button>
        }
      />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informacion de la solicitud</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground text-sm">Titulo</dt>
                <dd className="font-medium">{request.title}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-sm">Propiedad</dt>
                <dd className="font-medium">
                  {request.property.address}, {request.property.city}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-sm">Solicitante</dt>
                <dd className="font-medium">{request.requester.name}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-sm">Urgencia</dt>
                <dd>
                  <Badge
                    variant={urgencyVariant[request.urgency] ?? 'outline'}
                    className={request.urgency === 'HIGH' ? 'text-orange-600' : undefined}
                  >
                    {SERVICE_URGENCY_LABELS[request.urgency] ?? request.urgency}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-sm">Estado</dt>
                <dd>
                  <Badge variant="secondary">
                    {SERVICE_STATUS_LABELS[request.status] ?? request.status}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-sm">Fecha de creacion</dt>
                <dd className="font-medium">
                  {formatDistanceToNow(new Date(request.createdAt), {
                    addSuffix: true,
                    locale: es,
                  })}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground text-sm">Descripcion</dt>
                <dd className="mt-1 whitespace-pre-wrap font-medium">{request.description}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {request.photos.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Fotos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {request.photos.map((photo) => (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => setPreviewPhoto(photo.url)}
                    className="overflow-hidden rounded-md border"
                  >
                    <img
                      src={photo.url}
                      alt="Foto de solicitud"
                      className="aspect-square w-full object-cover transition-transform hover:scale-105"
                    />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {isAdmin && nextStatus && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Acciones</CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setStatusConfirm(nextStatus)}>
                {TRANSITION_LABELS[nextStatus]}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Photo preview overlay */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => setPreviewPhoto(null)}
        >
          <img
            src={previewPhoto}
            alt="Vista previa"
            className="max-h-[85vh] max-w-[90vw] rounded-md object-contain"
          />
        </div>
      )}

      <ConfirmDialog
        open={!!statusConfirm}
        onOpenChange={() => setStatusConfirm(null)}
        title="Cambiar estado"
        description={`¿Estas seguro de que queres cambiar el estado a "${statusConfirm ? (SERVICE_STATUS_LABELS[statusConfirm] ?? statusConfirm) : ''}"?`}
        variant="default"
        onConfirm={() => {
          if (statusConfirm) {
            updateStatus.mutate(
              { id, status: statusConfirm },
              { onSuccess: () => setStatusConfirm(null) },
            );
          }
        }}
        isLoading={updateStatus.isPending}
      />
    </div>
  );
}
