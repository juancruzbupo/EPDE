'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useBudget, useUpdateBudgetStatus } from '@/hooks/use-budgets';
import { useAuthStore } from '@/stores/auth-store';
import { PageHeader } from '@/components/page-header';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft } from 'lucide-react';
import { BUDGET_STATUS_LABELS, UserRole } from '@epde/shared';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { RespondBudgetDialog } from './respond-budget-dialog';
import { budgetStatusVariant, budgetStatusClassName } from '@/lib/style-maps';

const formatCurrency = (value: string | number) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(Number(value));

type ConfirmAction = 'APPROVED' | 'REJECTED' | 'IN_PROGRESS' | 'COMPLETED' | null;

const confirmMessages: Record<string, { title: string; description: string }> = {
  APPROVED: {
    title: 'Aprobar presupuesto',
    description: 'Estas seguro de que queres aprobar este presupuesto?',
  },
  REJECTED: {
    title: 'Rechazar presupuesto',
    description:
      'Estas seguro de que queres rechazar este presupuesto? Esta accion no se puede deshacer.',
  },
  IN_PROGRESS: {
    title: 'Iniciar trabajo',
    description: 'Estas seguro de que queres iniciar el trabajo de este presupuesto?',
  },
  COMPLETED: {
    title: 'Marcar completado',
    description: 'Estas seguro de que queres marcar este presupuesto como completado?',
  },
};

export default function BudgetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const [respondOpen, setRespondOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);

  const { data, isLoading } = useBudget(id);
  const updateStatus = useUpdateBudgetStatus();

  const budget = data?.data;

  const handleStatusChange = () => {
    if (!confirmAction) return;
    updateStatus.mutate({ id, status: confirmAction }, { onSuccess: () => setConfirmAction(null) });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!budget) {
    return <p className="text-muted-foreground">Presupuesto no encontrado</p>;
  }

  const isAdmin = user?.role === UserRole.ADMIN;
  const isClient = user?.role === UserRole.CLIENT;
  const hasResponse = budget.status !== 'PENDING' && budget.lineItems.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={budget.title}
        description={`Solicitado por ${budget.requester.name}`}
        action={
          <Button variant="outline" asChild>
            <Link href="/budgets">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Link>
          </Button>
        }
      />

      {/* Budget Info Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Informacion del presupuesto</CardTitle>
          <Badge
            variant={budgetStatusVariant[budget.status] ?? 'outline'}
            className={budgetStatusClassName[budget.status] ?? ''}
          >
            {BUDGET_STATUS_LABELS[budget.status] ?? budget.status}
          </Badge>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground text-sm">Titulo</dt>
              <dd className="font-medium">{budget.title}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm">Propiedad</dt>
              <dd className="font-medium">
                {budget.property.address}, {budget.property.city}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm">Solicitante</dt>
              <dd className="font-medium">{budget.requester.name}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm">Fecha</dt>
              <dd className="font-medium">
                {formatDistanceToNow(new Date(budget.createdAt), {
                  addSuffix: true,
                  locale: es,
                })}
              </dd>
            </div>
            {budget.description && (
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground text-sm">Descripcion</dt>
                <dd className="font-medium">{budget.description}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      {/* Response Details (line items, total, etc.) */}
      {hasResponse && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Detalle de cotizacion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descripcion</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead className="text-right">Precio Unitario</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {budget.lineItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.description}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.subtotal)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end">
              <p className="text-lg font-semibold">
                Total: {budget.response ? formatCurrency(budget.response.totalAmount) : '-'}
              </p>
            </div>

            {budget.response && (
              <dl className="grid gap-4 sm:grid-cols-3">
                {budget.response.estimatedDays && (
                  <div>
                    <dt className="text-muted-foreground text-sm">Dias estimados</dt>
                    <dd className="font-medium">{budget.response.estimatedDays} dias</dd>
                  </div>
                )}
                {budget.response.validUntil && (
                  <div>
                    <dt className="text-muted-foreground text-sm">Valido hasta</dt>
                    <dd className="font-medium">
                      {new Date(budget.response.validUntil).toLocaleDateString('es-AR')}
                    </dd>
                  </div>
                )}
                {budget.response.notes && (
                  <div className="sm:col-span-3">
                    <dt className="text-muted-foreground text-sm">Notas</dt>
                    <dd className="font-medium">{budget.response.notes}</dd>
                  </div>
                )}
              </dl>
            )}
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        {isAdmin && budget.status === 'PENDING' && (
          <Button onClick={() => setRespondOpen(true)}>Cotizar</Button>
        )}
        {isClient && budget.status === 'QUOTED' && (
          <>
            <Button onClick={() => setConfirmAction('APPROVED')}>Aprobar</Button>
            <Button variant="destructive" onClick={() => setConfirmAction('REJECTED')}>
              Rechazar
            </Button>
          </>
        )}
        {isAdmin && budget.status === 'APPROVED' && (
          <Button onClick={() => setConfirmAction('IN_PROGRESS')}>Iniciar Trabajo</Button>
        )}
        {isAdmin && budget.status === 'IN_PROGRESS' && (
          <Button onClick={() => setConfirmAction('COMPLETED')}>Marcar Completado</Button>
        )}
      </div>

      {/* Respond Dialog */}
      <RespondBudgetDialog open={respondOpen} onOpenChange={setRespondOpen} budgetId={id} />

      {/* Confirm Dialog for status changes */}
      <ConfirmDialog
        open={!!confirmAction}
        onOpenChange={() => setConfirmAction(null)}
        title={confirmAction ? (confirmMessages[confirmAction]?.title ?? '') : ''}
        description={confirmAction ? (confirmMessages[confirmAction]?.description ?? '') : ''}
        onConfirm={handleStatusChange}
        isLoading={updateStatus.isPending}
        variant={confirmAction === 'REJECTED' ? 'destructive' : 'default'}
      />
    </div>
  );
}
