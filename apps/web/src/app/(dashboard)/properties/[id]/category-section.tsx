import {
  PRIORITY_VARIANT,
  RECURRENCE_TYPE_LABELS,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  TASK_STATUS_VARIANT,
  TaskStatus,
} from '@epde/shared';
import {
  ArrowDown,
  ArrowUp,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Pencil,
  Trash2,
} from 'lucide-react';
import { memo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import type { TaskPublic } from '@/lib/api/maintenance-plans';
import { cn } from '@/lib/utils';

const COMPLETABLE_STATUSES: TaskStatus[] = [
  TaskStatus.PENDING,
  TaskStatus.UPCOMING,
  TaskStatus.OVERDUE,
];

export function isCompletable(task: TaskPublic) {
  return COMPLETABLE_STATUSES.includes(task.status);
}

export const CategorySection = memo(function CategorySection({
  categoryName,
  tasks,
  defaultOpen,
  onEdit,
  onDelete,
  onComplete,
  onMove,
  selectionMode,
  selectedIds,
  onToggleSelect,
}: {
  categoryName: string;
  tasks: TaskPublic[];
  defaultOpen: boolean;
  onEdit: (task: TaskPublic) => void;
  onDelete: (taskId: string) => void;
  onComplete: (task: TaskPublic) => void;
  onMove: (taskId: string, direction: 'up' | 'down') => void;
  selectionMode: boolean;
  selectedIds: Set<string>;
  onToggleSelect: (taskId: string) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="focus-visible:ring-ring/50 mb-2 flex w-full items-center gap-2 rounded py-1 text-left focus-visible:ring-[3px] focus-visible:outline-none"
      >
        {open ? (
          <ChevronDown className="text-muted-foreground h-4 w-4" />
        ) : (
          <ChevronRight className="text-muted-foreground h-4 w-4" />
        )}
        <span className="text-sm font-medium">{categoryName}</span>
        <span className="text-muted-foreground text-sm">({tasks.length})</span>
      </button>
      {open && (
        <div className="space-y-1.5 pl-6">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={cn(
                'bg-card flex items-center justify-between gap-2 rounded-lg border p-3',
                selectionMode && selectedIds.has(task.id) && 'border-primary bg-primary/5',
              )}
            >
              {selectionMode && isCompletable(task) && (
                <input
                  type="checkbox"
                  checked={selectedIds.has(task.id)}
                  onChange={() => onToggleSelect(task.id)}
                  className="h-4 w-4 shrink-0 rounded"
                  aria-label={`Seleccionar ${task.name}`}
                />
              )}
              {selectionMode && !isCompletable(task) && <div className="w-4 shrink-0" />}
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-start gap-2">
                  <span className="text-sm leading-tight font-medium">{task.name}</span>
                  <Badge
                    variant={TASK_STATUS_VARIANT[task.status] ?? 'secondary'}
                    className="shrink-0 text-xs"
                  >
                    {TASK_STATUS_LABELS[task.status] ?? task.status}
                  </Badge>
                </div>
                <div className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                  <Badge
                    variant={PRIORITY_VARIANT[task.priority] ?? 'secondary'}
                    className="text-xs"
                  >
                    {TASK_PRIORITY_LABELS[task.priority] ?? task.priority}
                  </Badge>
                  <span className="text-muted-foreground/40">·</span>
                  <span>{RECURRENCE_TYPE_LABELS[task.recurrenceType] ?? task.recurrenceType}</span>
                  <span className="text-muted-foreground/40">·</span>
                  <span>
                    {task.nextDueDate
                      ? `Próxima: ${new Date(task.nextDueDate).toLocaleDateString('es-AR')}`
                      : RECURRENCE_TYPE_LABELS.ON_DETECTION}
                  </span>
                </div>
              </div>

              {!selectionMode && (
                <div className="flex shrink-0 gap-1">
                  {isCompletable(task) && (
                    <button
                      onClick={() => onComplete(task)}
                      className="text-muted-foreground hover:text-success focus-visible:ring-ring/50 rounded p-2 focus-visible:ring-[3px] focus-visible:outline-none"
                      aria-label="Registrar inspección"
                      title="Registrar inspección"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => onMove(task.id, 'up')}
                    className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 rounded p-1 focus-visible:ring-[3px] focus-visible:outline-none"
                    aria-label="Mover arriba"
                    title="Mover arriba"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => onMove(task.id, 'down')}
                    className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 rounded p-1 focus-visible:ring-[3px] focus-visible:outline-none"
                    aria-label="Mover abajo"
                    title="Mover abajo"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => onEdit(task)}
                    className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 rounded p-2 focus-visible:ring-[3px] focus-visible:outline-none"
                    aria-label="Editar tarea"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDelete(task.id)}
                    className="text-muted-foreground hover:text-destructive focus-visible:ring-ring/50 rounded p-2 focus-visible:ring-[3px] focus-visible:outline-none"
                    aria-label="Eliminar tarea"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
