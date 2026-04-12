'use client';

import type { BudgetRequestPublic } from '@epde/shared';
import {
  BUDGET_STATUS_LABELS,
  BUDGET_STATUS_VARIANT,
  BudgetStatus,
  formatARS,
  formatRelativeDate,
} from '@epde/shared';
import {
  AlignLeft,
  ArrowLeft,
  Calendar,
  CalendarCheck,
  Clock,
  FileText,
  Home,
  StickyNote,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Breadcrumbs } from '@/components/breadcrumbs';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { ErrorState } from '@/components/error-state';
import { BudgetTour } from '@/components/onboarding-tour';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useBudget, useUpdateBudgetStatus } from '@/hooks/use-budgets';

import { BudgetAttachments } from './budget-attachments';
import { BudgetComments } from './budget-comments';
import { BudgetTimeline } from './budget-timeline';
import { EditBudgetDialog } from './edit-budget-dialog';
import { RespondBudgetDialog } from './respond-budget-dialog';

type ConfirmAction = BudgetStatus | null;

const confirmMessages: Partial<Record<BudgetStatus, { title: string; description: string }>> = {
  [BudgetStatus.APPROVED]: {
    title: 'Aprobar presupuesto',
    description: '¿Estás seguro de que queres aprobar este presupuesto?',
  },
  [BudgetStatus.REJECTED]: {
    title: 'Rechazar presupuesto',
    description:
      '¿Estás seguro de que queres rechazar este presupuesto? Esta acción no se puede deshacer.',
  },
  [BudgetStatus.IN_PROGRESS]: {
    title: 'Iniciar trabajo',
    description: '¿Estás seguro de que queres iniciar el trabajo de este presupuesto?',
  },
  [BudgetStatus.COMPLETED]: {
    title: 'Marcar completado',
    description: '¿Estás seguro de que queres marcar este presupuesto como completado?',
  },
};

interface BudgetDetailProps {
  id: string;
  isAdmin: boolean;
  isClient: boolean;
  initialData?: BudgetRequestPublic;
}

export function BudgetDetail({ id, isAdmin, isClient, initialData }: BudgetDetailProps) {
  const [respondOpen, setRespondOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);

  const { data, isLoading, isError, refetch } = useBudget(id, { initialData });
  const updateStatus = useUpdateBudgetStatus();

  const budget = data;

  const handleStatusChange = () => {
    if (!confirmAction) return;
    updateStatus.mutate({ id, status: confirmAction }, { onSuccess: () => setConfirmAction(null) });
  };

  if (isError && !budget)
    return (
      <ErrorState message="No se pudo cargar el presupuesto" onRetry={refetch} className="py-24" />
    );
  if (isLoading && !budget) {
    return (
      <div className="space-y-4">
        <div className="bg-muted/40 h-8 w-48 animate-pulse rounded" />
        <div className="bg-muted/40 h-64 animate-pulse rounded-xl" />
      </div>
    );
  }
  if (!budget) return null;

  const hasResponse = budget.status !== BudgetStatus.PENDING && budget.lineItems.length > 0;

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Presupuestos', href: '/budgets' }, { label: budget.title }]} />
      <PageHeader
        title={budget.title}
        description={`Solicitado por ${budget.requester.name}`}
        action={
          <Button variant="outline" asChild>
            <Link href="/budgets">
              <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
              Volver
            </Link>
          </Button>
        }
      />

      <BudgetTour />
      <Card data-tour="budget-status">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-lg">Información del presupuesto</CardTitle>
          <Badge variant={BUDGET_STATUS_VARIANT[budget.status] ?? 'secondary'}>
            {BUDGET_STATUS_LABELS[budget.status] ?? budget.status}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/40 rounded-lg p-4">
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <div className="space-y-1">
                <dt className="text-muted-foreground flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                  Título
                </dt>
                <dd className="font-medium">{budget.title}</dd>
              </div>
              <div className="space-y-1">
                <dt className="text-muted-foreground flex items-center gap-1.5">
                  <Home className="h-3.5 w-3.5" aria-hidden="true" />
                  Propiedad
                </dt>
                <dd className="font-medium">
                  {budget.property.address}, {budget.property.city}
                </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-muted-foreground flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" aria-hidden="true" />
                  Solicitante
                </dt>
                <dd className="font-medium">{budget.requester.name}</dd>
              </div>
              <div className="space-y-1">
                <dt className="text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                  Fecha
                </dt>
                <dd className="font-medium">{formatRelativeDate(new Date(budget.createdAt))}</dd>
              </div>
              {budget.description && (
                <div className="space-y-1 sm:col-span-2">
                  <dt className="text-muted-foreground flex items-center gap-1.5">
                    <AlignLeft className="h-3.5 w-3.5" aria-hidden="true" />
                    Descripción
                  </dt>
                  <dd className="font-medium">{budget.description}</dd>
                </div>
              )}
            </dl>
          </div>
        </CardContent>
      </Card>

      {isClient && budget.status === BudgetStatus.PENDING && (
        <div className="bg-muted/40 text-muted-foreground rounded-lg p-3 text-sm">
          Tu solicitud fue recibida. El equipo de EPDE preparará una cotización y te notificará
          cuando esté lista.
        </div>
      )}

      {hasResponse && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Detalle de cotización</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descripción</TableHead>
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
                      <TableCell className="text-right">{formatARS(item.unitPrice)}</TableCell>
                      <TableCell className="text-right">{formatARS(item.subtotal)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end">
              <p className="text-lg font-semibold">
                Total: {budget.response ? formatARS(budget.response.totalAmount) : '-'}
              </p>
            </div>

            {budget.response && (
              <div className="bg-muted/40 rounded-lg p-4">
                <dl className="grid gap-4 text-sm sm:grid-cols-3">
                  {budget.response.estimatedDays && (
                    <div className="space-y-1">
                      <dt className="text-muted-foreground flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                        Días estimados
                      </dt>
                      <dd className="font-medium">{budget.response.estimatedDays} días</dd>
                    </div>
                  )}
                  {budget.response.validUntil && (
                    <div className="space-y-1">
                      <dt className="text-muted-foreground flex items-center gap-1.5">
                        <CalendarCheck className="h-3.5 w-3.5" aria-hidden="true" />
                        Válido hasta
                      </dt>
                      <dd className="font-medium">
                        {new Date(budget.response.validUntil).toLocaleDateString('es-AR')}
                      </dd>
                    </div>
                  )}
                  {budget.response.notes && (
                    <div className="space-y-1 sm:col-span-3">
                      <dt className="text-muted-foreground flex items-center gap-1.5">
                        <StickyNote className="h-3.5 w-3.5" aria-hidden="true" />
                        Notas
                      </dt>
                      <dd className="font-medium">{budget.response.notes}</dd>
                    </div>
                  )}
                </dl>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Actions card */}
      {(isAdmin &&
        (budget.status === BudgetStatus.PENDING ||
          budget.status === BudgetStatus.QUOTED ||
          budget.status === BudgetStatus.APPROVED ||
          budget.status === BudgetStatus.IN_PROGRESS)) ||
      (isClient &&
        (budget.status === BudgetStatus.PENDING || budget.status === BudgetStatus.QUOTED)) ? (
        <Card data-tour="budget-actions">
          <CardContent className="flex gap-2 p-4">
            {isClient && budget.status === BudgetStatus.PENDING && (
              <Button variant="outline" onClick={() => setEditOpen(true)}>
                Editar
              </Button>
            )}
            {isAdmin && budget.status === BudgetStatus.PENDING && (
              <Button onClick={() => setRespondOpen(true)}>Cotizar</Button>
            )}
            {isAdmin && budget.status === BudgetStatus.QUOTED && (
              <Button variant="outline" onClick={() => setRespondOpen(true)}>
                Re-cotizar
              </Button>
            )}
            {isClient && budget.status === BudgetStatus.QUOTED && (
              <>
                <Button onClick={() => setConfirmAction(BudgetStatus.APPROVED)}>Aprobar</Button>
                <Button
                  variant="destructive"
                  onClick={() => setConfirmAction(BudgetStatus.REJECTED)}
                >
                  Rechazar
                </Button>
              </>
            )}
            {isAdmin && budget.status === BudgetStatus.APPROVED && (
              <Button onClick={() => setConfirmAction(BudgetStatus.IN_PROGRESS)}>
                Iniciar Trabajo
              </Button>
            )}
            {isAdmin && budget.status === BudgetStatus.IN_PROGRESS && (
              <Button onClick={() => setConfirmAction(BudgetStatus.COMPLETED)}>
                Marcar Completado
              </Button>
            )}
          </CardContent>
        </Card>
      ) : null}

      {/* Attachments */}
      {'attachments' in budget && (
        <BudgetAttachments
          budgetId={id}
          attachments={(budget as BudgetRequestPublic & { attachments: never[] }).attachments ?? []}
          budgetStatus={budget.status}
        />
      )}

      {/* Comments */}
      <BudgetComments budgetId={id} budgetStatus={budget.status} />

      {/* Timeline */}
      <BudgetTimeline budgetId={id} />

      {/* Dialogs */}
      <RespondBudgetDialog
        open={respondOpen}
        onOpenChange={setRespondOpen}
        budgetId={id}
        initialLineItems={budget.status === BudgetStatus.QUOTED ? budget.lineItems : undefined}
        initialEstimatedDays={
          budget.status === BudgetStatus.QUOTED ? budget.response?.estimatedDays : undefined
        }
        initialValidUntil={
          budget.status === BudgetStatus.QUOTED ? budget.response?.validUntil : undefined
        }
        initialNotes={budget.status === BudgetStatus.QUOTED ? budget.response?.notes : undefined}
      />

      {budget.status === BudgetStatus.PENDING && (
        <EditBudgetDialog open={editOpen} onOpenChange={setEditOpen} budget={budget} />
      )}

      <ConfirmDialog
        open={!!confirmAction}
        onOpenChange={() => setConfirmAction(null)}
        title={confirmAction ? (confirmMessages[confirmAction]?.title ?? '') : ''}
        description={confirmAction ? (confirmMessages[confirmAction]?.description ?? '') : ''}
        onConfirm={handleStatusChange}
        isLoading={updateStatus.isPending}
        variant={confirmAction === BudgetStatus.REJECTED ? 'destructive' : 'default'}
      />
    </div>
  );
}
