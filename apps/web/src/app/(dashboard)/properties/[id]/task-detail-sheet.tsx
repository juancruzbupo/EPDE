'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle } from 'lucide-react';
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
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{task.name}</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant={taskStatusVariant[task.status] ?? 'outline'}>
              {TASK_STATUS_LABELS[task.status] ?? task.status}
            </Badge>
            <Badge variant="outline">{task.category.name}</Badge>
            <span className={`rounded px-2 py-0.5 text-xs ${priorityColors[task.priority] ?? ''}`}>
              {TASK_PRIORITY_LABELS[task.priority] ?? task.priority}
            </span>
          </div>

          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Recurrencia</dt>
              <dd className="font-medium">
                {RECURRENCE_TYPE_LABELS[task.recurrenceType] ?? task.recurrenceType}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Próximo vencimiento</dt>
              <dd className={`font-medium ${isOverdue ? 'text-red-600' : ''}`}>
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

          {task.description && (
            <div>
              <p className="text-muted-foreground text-sm">Descripción</p>
              <p className="mt-1 text-sm">{task.description}</p>
            </div>
          )}

          {canComplete && onComplete && (
            <Button className="w-full" onClick={() => onComplete(task)}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Completar Tarea
            </Button>
          )}

          <Tabs defaultValue="history" className="mt-4">
            <TabsList className="w-full">
              <TabsTrigger value="history" className="flex-1">
                Historial
              </TabsTrigger>
              <TabsTrigger value="notes" className="flex-1">
                Notas
              </TabsTrigger>
            </TabsList>

            <TabsContent value="history" className="mt-3">
              <TaskLogTimeline planId={planId} taskId={task.id} />
            </TabsContent>

            <TabsContent value="notes" className="mt-3">
              <TaskNotes planId={planId} taskId={task.id} />
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
