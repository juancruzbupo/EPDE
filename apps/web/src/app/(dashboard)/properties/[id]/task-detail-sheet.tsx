'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, Calendar, RotateCcw } from 'lucide-react';
import { TASK_PRIORITY_LABELS, RECURRENCE_TYPE_LABELS, TASK_STATUS_LABELS } from '@epde/shared';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { TaskLogTimeline } from './task-log-timeline';
import { TaskNotes } from './task-notes';
import { priorityColors, taskStatusVariant } from '@/lib/style-maps';
import type { TaskPublic } from '@/lib/api/maintenance-plans';

interface TaskDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: TaskPublic | null;
  planId: string;
  onComplete?: (task: TaskPublic) => void;
}

export function TaskDetailSheet({
  open,
  onOpenChange,
  task,
  planId,
  onComplete,
}: TaskDetailSheetProps) {
  if (!task) return null;

  const canComplete =
    task.status === 'PENDING' || task.status === 'UPCOMING' || task.status === 'OVERDUE';
  const isOverdue = task.nextDueDate ? new Date(task.nextDueDate) < new Date() : false;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col overflow-y-auto sm:max-w-lg">
        <SheetHeader className="px-6 pb-4">
          <SheetTitle className="text-lg leading-tight">{task.name}</SheetTitle>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant={taskStatusVariant[task.status] ?? 'outline'}>
              {TASK_STATUS_LABELS[task.status] ?? task.status}
            </Badge>
            <Badge variant="outline">{task.category.name}</Badge>
            <span className={`rounded px-2 py-0.5 text-xs ${priorityColors[task.priority] ?? ''}`}>
              {TASK_PRIORITY_LABELS[task.priority] ?? task.priority}
            </span>
          </div>
        </SheetHeader>

        <Separator />

        <div className="flex-1 space-y-6 px-6 pb-6">
          {/* Info card */}
          <div className="bg-muted/40 rounded-lg p-4">
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <dt className="text-muted-foreground flex items-center gap-1.5">
                  <RotateCcw className="h-3.5 w-3.5" />
                  Recurrencia
                </dt>
                <dd className="font-medium">
                  {RECURRENCE_TYPE_LABELS[task.recurrenceType] ?? task.recurrenceType}
                </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  Próximo vencimiento
                </dt>
                <dd className={`font-medium ${isOverdue ? 'text-destructive' : ''}`}>
                  {task.nextDueDate ? (
                    <>
                      {new Date(task.nextDueDate).toLocaleDateString('es-AR')}
                      <span className="text-muted-foreground ml-1 text-xs font-normal">
                        (
                        {formatDistanceToNow(new Date(task.nextDueDate), {
                          addSuffix: true,
                          locale: es,
                        })}
                        )
                      </span>
                    </>
                  ) : (
                    'Según detección'
                  )}
                </dd>
              </div>
            </dl>
          </div>

          {/* Description */}
          {task.description && (
            <div className="space-y-1.5">
              <h4 className="text-muted-foreground text-sm font-medium">Descripción</h4>
              <p className="text-sm leading-relaxed">{task.description}</p>
            </div>
          )}

          {/* CTA */}
          {canComplete && onComplete && (
            <Button className="w-full" size="lg" onClick={() => onComplete(task)}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Completar Tarea
            </Button>
          )}

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
      </SheetContent>
    </Sheet>
  );
}
