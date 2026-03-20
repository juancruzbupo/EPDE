'use client';

import {
  CONDITION_FOUND_LABELS,
  formatRelativeDate,
  PRIORITY_VARIANT,
  PROFESSIONAL_REQUIREMENT_LABELS,
  ProfessionalRequirement,
  PROPERTY_SECTOR_LABELS,
  RECURRENCE_TYPE_LABELS,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  TASK_STATUS_VARIANT,
  TASK_TYPE_LABELS,
  TaskStatus,
} from '@epde/shared';
import {
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  RotateCcw,
  Wrench,
} from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { TaskDetailPublic, TaskPublic } from '@/lib/api/maintenance-plans';
import { PROFESSIONAL_REQ_COLORS, TASK_TYPE_COLORS } from '@/lib/style-maps';

import { TaskLogTimeline } from './task-log-timeline';
import { TaskNotes } from './task-notes';

interface TaskDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: (TaskPublic | TaskDetailPublic) | null;
  planId: string;
  onComplete?: (task: TaskPublic) => void;
  onRequestService?: (task: TaskPublic) => void;
}

export function TaskDetailSheet({
  open,
  onOpenChange,
  task,
  planId,
  onComplete,
  onRequestService,
}: TaskDetailSheetProps) {
  const [techDescOpen, setTechDescOpen] = useState(false);

  if (!task) return null;

  const taskLogs = 'taskLogs' in task ? task.taskLogs : undefined;
  const lastLog = taskLogs?.[0];
  const canComplete =
    task.status === TaskStatus.PENDING ||
    task.status === TaskStatus.UPCOMING ||
    task.status === TaskStatus.OVERDUE;
  const isOverdue = task.nextDueDate ? new Date(task.nextDueDate) < new Date() : false;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col sm:max-w-lg">
        <SheetHeader className="px-6 pb-4">
          <SheetTitle className="text-lg leading-tight">{task.name}</SheetTitle>
          <SheetDescription className="sr-only">
            Detalle de tarea, historial y notas
          </SheetDescription>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant={TASK_STATUS_VARIANT[task.status] ?? 'secondary'}>
              {TASK_STATUS_LABELS[task.status] ?? task.status}
            </Badge>
            <Badge variant="outline">{task.category.name}</Badge>
            {task.sector && (
              <Badge variant="outline">{PROPERTY_SECTOR_LABELS[task.sector] ?? task.sector}</Badge>
            )}
            <Badge variant={PRIORITY_VARIANT[task.priority] ?? 'secondary'} className="text-xs">
              {TASK_PRIORITY_LABELS[task.priority] ?? task.priority}
            </Badge>
          </div>
        </SheetHeader>

        <Separator />

        <div className="flex-1 space-y-6 overflow-y-auto px-6 pb-6">
          {/* Key info: due date + professional requirement (most important for the user) */}
          <div className="bg-muted/40 space-y-3 rounded-lg p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
                  <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                  Próximo vencimiento
                </p>
                <p className={`font-medium ${isOverdue ? 'text-destructive' : ''}`}>
                  {task.nextDueDate ? (
                    <>
                      {new Date(task.nextDueDate).toLocaleDateString('es-AR')}
                      <span className="text-muted-foreground ml-1 text-xs font-normal">
                        ({formatRelativeDate(new Date(task.nextDueDate))})
                      </span>
                    </>
                  ) : (
                    <span className="text-muted-foreground text-sm">Según detección</span>
                  )}
                </p>
              </div>
              <Badge className={PROFESSIONAL_REQ_COLORS[task.professionalRequirement]}>
                {PROFESSIONAL_REQUIREMENT_LABELS[task.professionalRequirement]}
              </Badge>
            </div>
            <p className="text-muted-foreground text-xs">
              {task.professionalRequirement === ProfessionalRequirement.OWNER_CAN_DO &&
                'Podés hacerla vos mismo'}
              {task.professionalRequirement === ProfessionalRequirement.PROFESSIONAL_RECOMMENDED &&
                'Mejor con un profesional, pero podés intentar'}
              {task.professionalRequirement === ProfessionalRequirement.PROFESSIONAL_REQUIRED &&
                'Necesariamente debe hacerlo un profesional'}
            </p>
          </div>

          {/* Last completion */}
          {lastLog && (
            <div className="border-border rounded-lg border p-3">
              <p className="type-label-md text-muted-foreground mb-1">Última completación</p>
              <p className="type-body-sm">{formatRelativeDate(new Date(lastLog.completedAt))}</p>
              <p className="type-body-sm">
                Condición: {CONDITION_FOUND_LABELS[lastLog.conditionFound]}
              </p>
              <p className="type-body-sm text-muted-foreground">Por: {lastLog.user.name}</p>
            </div>
          )}

          {/* Description */}
          {task.description && (
            <div className="space-y-1.5">
              <h4 className="text-muted-foreground text-sm font-medium">Descripción</h4>
              <p className="text-sm leading-relaxed">{task.description}</p>
            </div>
          )}

          {/* More details — collapsible */}
          <div className="border-border border-t pt-3">
            <button
              type="button"
              className="text-muted-foreground flex w-full items-center justify-between text-sm font-medium"
              aria-expanded={techDescOpen}
              onClick={() => setTechDescOpen((v) => !v)}
            >
              Más detalles
              {techDescOpen ? (
                <ChevronUp className="h-4 w-4" aria-hidden="true" />
              ) : (
                <ChevronDown className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
            {techDescOpen && (
              <dl className="mt-3 grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <dt className="text-muted-foreground flex items-center gap-1.5">
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                    Recurrencia
                  </dt>
                  <dd className="font-medium">
                    {RECURRENCE_TYPE_LABELS[task.recurrenceType] ?? task.recurrenceType}
                  </dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-muted-foreground flex items-center gap-1.5">
                    <Wrench className="h-3.5 w-3.5" aria-hidden="true" />
                    Tipo de tarea
                  </dt>
                  <dd>
                    <Badge className={TASK_TYPE_COLORS[task.taskType]}>
                      {TASK_TYPE_LABELS[task.taskType]}
                    </Badge>
                  </dd>
                </div>
                {task.estimatedDurationMinutes != null && (
                  <div className="space-y-1">
                    <dt className="text-muted-foreground flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                      Duración estimada
                    </dt>
                    <dd className="font-medium">{task.estimatedDurationMinutes} min</dd>
                  </div>
                )}
                {task.technicalDescription && (
                  <div className="col-span-2 space-y-1">
                    <dt className="text-muted-foreground text-xs">Descripción técnica</dt>
                    <dd className="text-sm leading-relaxed">{task.technicalDescription}</dd>
                  </div>
                )}
                {task.professionalRequirement !== ProfessionalRequirement.OWNER_CAN_DO && (
                  <div className="col-span-2">
                    <p className="type-body-sm text-muted-foreground">
                      Las inspecciones preventivas cuestan entre $80.000 y $250.000. Las
                      reparaciones por falta de prevención pueden superar los $2.000.000.
                    </p>
                  </div>
                )}
              </dl>
            )}
          </div>

          {/* Tabs */}
          <Tabs defaultValue="history">
            <TabsList className="w-full">
              <TabsTrigger value="history" className="flex-1">
                Historial
              </TabsTrigger>
              <TabsTrigger value="notes" className="flex-1">
                Notas
              </TabsTrigger>
            </TabsList>

            <TabsContent value="history" className="mt-4">
              <TaskLogTimeline planId={planId} taskId={task.id} />
            </TabsContent>

            <TabsContent value="notes" className="mt-4">
              <TaskNotes planId={planId} taskId={task.id} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Sticky CTA footer — always visible without scrolling */}
        <div className="border-t px-6 py-4">
          <div className="flex gap-2">
            {canComplete && onComplete && (
              <Button
                className="flex-1"
                size="lg"
                onClick={() => onComplete(task)}
                title="Registrá que completaste esta tarea"
              >
                <CheckCircle className="mr-2 h-4 w-4" aria-hidden="true" />
                Completar Tarea
              </Button>
            )}
            {onRequestService && (
              <Button
                variant="outline"
                className={canComplete && onComplete ? '' : 'w-full'}
                onClick={() => onRequestService(task)}
              >
                <Wrench className="mr-2 h-4 w-4" aria-hidden="true" />
                Solicitar Servicio
              </Button>
            )}
          </div>
          {task.professionalRequirement !== ProfessionalRequirement.OWNER_CAN_DO && (
            <p className="type-body-sm text-muted-foreground mt-1 text-center">
              Esta tarea requiere intervención profesional
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
