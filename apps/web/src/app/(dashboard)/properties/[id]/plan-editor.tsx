'use client';

import {
  PLAN_STATUS_LABELS,
  PlanStatus,
  PRIORITY_VARIANT,
  RECURRENCE_TYPE_LABELS,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  TASK_STATUS_VARIANT,
  TaskPriority,
  TaskStatus,
} from '@epde/shared';
import {
  Archive,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  LayoutTemplate,
  Pencil,
  Play,
  Plus,
  Trash2,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import { ConfirmDialog } from '@/components/confirm-dialog';
import { ErrorState } from '@/components/error-state';
import { SearchInput } from '@/components/search-input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useCategoryTemplates } from '@/hooks/use-category-templates';
import { useDebounce } from '@/hooks/use-debounce';
import { usePlan, useUpdatePlan } from '@/hooks/use-plans';
import { useBulkAddTasks, useRemoveTask } from '@/hooks/use-task-operations';
import type { TaskPublic } from '@/lib/api/maintenance-plans';
import { TASK_STATUS_COLORS, TASK_STATUS_ICONS, TASK_STATUS_ORDER } from '@/lib/style-maps';
import { cn } from '@/lib/utils';

import { BulkCompleteDialog } from './bulk-complete-dialog';
import { CompleteTaskDialog } from './complete-task-dialog';
import { TaskDialog } from './task-dialog';

const SHOW_SEARCH_THRESHOLD = 5;

const PRIORITY_OPTIONS: { value: TaskPriority | 'all'; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: TaskPriority.HIGH, label: 'Alta' },
  { value: TaskPriority.MEDIUM, label: 'Media' },
  { value: TaskPriority.LOW, label: 'Baja' },
];

interface PlanEditorProps {
  planId: string;
  activeSectors?: string[];
}

function StatusSummary({ tasks }: { tasks: TaskPublic[] }) {
  const counts = useMemo(() => {
    const map = new Map<TaskStatus, number>();
    for (const s of TASK_STATUS_ORDER) map.set(s, 0);
    for (const t of tasks) map.set(t.status, (map.get(t.status) ?? 0) + 1);
    return map;
  }, [tasks]);

  return (
    <div className="flex flex-wrap gap-3">
      {TASK_STATUS_ORDER.map((status) => {
        const count = counts.get(status) ?? 0;
        if (count === 0) return null;
        const Icon = TASK_STATUS_ICONS[status];
        const color = TASK_STATUS_COLORS[status];
        return (
          <div key={status} className="flex items-center gap-1.5 text-sm">
            <Icon className={cn('h-4 w-4', color)} />
            <span className={cn('font-medium', color)}>{count}</span>
            <span className="text-muted-foreground">{TASK_STATUS_LABELS[status]}</span>
          </div>
        );
      })}
    </div>
  );
}

const COMPLETABLE_STATUSES: TaskStatus[] = [
  TaskStatus.PENDING,
  TaskStatus.UPCOMING,
  TaskStatus.OVERDUE,
];

function isCompletable(task: TaskPublic) {
  return COMPLETABLE_STATUSES.includes(task.status);
}

function CategorySection({
  categoryName,
  tasks,
  defaultOpen,
  onEdit,
  onDelete,
  onComplete,
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
                      : 'Según detección'}
                  </span>
                </div>
              </div>

              {!selectionMode && (
                <div className="flex shrink-0 gap-1">
                  {isCompletable(task) && (
                    <button
                      onClick={() => onComplete(task)}
                      className="text-muted-foreground hover:text-success focus-visible:ring-ring/50 rounded p-2 focus-visible:ring-[3px] focus-visible:outline-none"
                      aria-label="Completar tarea"
                      title="Registrar completación"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </button>
                  )}
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
}

export function PlanEditor({ planId, activeSectors }: PlanEditorProps) {
  const { data: plan, isLoading, isError, refetch } = usePlan(planId);
  const removeTask = useRemoveTask();
  const updatePlan = useUpdatePlan();
  const bulkAdd = useBulkAddTasks();
  const { data: categoryTemplates } = useCategoryTemplates();

  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskPublic | null>(null);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  const [completingTask, setCompletingTask] = useState<TaskPublic | null>(null);
  const [statusTransition, setStatusTransition] = useState<PlanStatus | null>(null);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [bulkCompleteOpen, setBulkCompleteOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState<TaskPriority | 'all'>('all');
  const debouncedSearch = useDebounce(search);

  const toggleSelect = useCallback((taskId: string) => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  }, []);

  const exitSelectionMode = useCallback(() => {
    setSelectionMode(false);
    setSelectedTaskIds(new Set());
  }, []);

  const tasks = plan?.tasks ?? [];

  const completableTasks = useMemo(() => tasks.filter(isCompletable), [tasks]);

  const filtered = useMemo(() => {
    let result = tasks;
    if (priority !== 'all') {
      result = result.filter((t) => t.priority === priority);
    }
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (t) => t.name.toLowerCase().includes(q) || t.category.name.toLowerCase().includes(q),
      );
    }
    return result;
  }, [tasks, priority, debouncedSearch]);

  const grouped = useMemo(() => {
    const map = new Map<string, { name: string; tasks: TaskPublic[] }>();
    for (const task of filtered) {
      const existing = map.get(task.category.id);
      if (existing) {
        existing.tasks.push(task);
      } else {
        map.set(task.category.id, { name: task.category.name, tasks: [task] });
      }
    }
    return Array.from(map.values());
  }, [filtered]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (isError && !plan) {
    return (
      <ErrorState
        message="No se pudo cargar el plan"
        onRetry={refetch}
        className="justify-center py-16"
      />
    );
  }

  if (!plan) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">{plan.name}</CardTitle>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant="outline">{PLAN_STATUS_LABELS[plan.status] ?? plan.status}</Badge>
            {plan.status === PlanStatus.DRAFT && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setStatusTransition(PlanStatus.ACTIVE)}
              >
                <Play className="mr-1.5 h-3.5 w-3.5" />
                Activar Plan
              </Button>
            )}
            {plan.status === PlanStatus.ACTIVE && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setStatusTransition(PlanStatus.ARCHIVED)}
              >
                <Archive className="mr-1.5 h-3.5 w-3.5" />
                Archivar Plan
              </Button>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setTemplateDialogOpen(true)}>
            <LayoutTemplate className="mr-2 h-4 w-4" />
            Aplicar Template
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setEditingTask(null);
              setTaskDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Agregar Tarea
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">
            No hay tareas en este plan. Agregá una para comenzar.
          </p>
        ) : (
          <div className="space-y-4">
            <StatusSummary tasks={tasks} />

            <div className="flex flex-wrap items-center gap-3">
              {tasks.length >= SHOW_SEARCH_THRESHOLD && (
                <SearchInput
                  value={search}
                  onChange={setSearch}
                  placeholder="Buscar tarea o categoría..."
                />
              )}
              <div className="flex gap-1">
                {PRIORITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setPriority(opt.value)}
                    className={cn(
                      'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                      priority === opt.value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80',
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {completableTasks.length > 1 && !selectionMode && (
                <Button size="sm" variant="outline" onClick={() => setSelectionMode(true)}>
                  <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                  Completar varias
                </Button>
              )}
            </div>

            {selectionMode && (
              <div className="bg-muted/50 flex items-center gap-3 rounded-lg p-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    const completableIds = completableTasks.map((t) => t.id);
                    setSelectedTaskIds((prev) =>
                      prev.size === completableIds.length ? new Set() : new Set(completableIds),
                    );
                  }}
                >
                  {selectedTaskIds.size === completableTasks.length
                    ? 'Deseleccionar todas'
                    : 'Seleccionar todas'}
                </Button>
                <span className="text-muted-foreground text-sm">
                  {selectedTaskIds.size} seleccionada{selectedTaskIds.size !== 1 ? 's' : ''}
                </span>
                <div className="flex-1" />
                <Button size="sm" variant="ghost" onClick={exitSelectionMode}>
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  disabled={selectedTaskIds.size === 0}
                  onClick={() => setBulkCompleteOpen(true)}
                >
                  <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                  Completar {selectedTaskIds.size > 0 ? `(${selectedTaskIds.size})` : ''}
                </Button>
              </div>
            )}

            {filtered.length === 0 ? (
              <p className="text-muted-foreground py-4 text-center text-sm">
                No se encontraron tareas con esa búsqueda.
              </p>
            ) : (
              <div className="space-y-4">
                <p className="text-muted-foreground text-sm">
                  {filtered.length} tarea{filtered.length !== 1 ? 's' : ''}
                  {grouped.length > 1 && ` en ${grouped.length} categorías`}
                </p>
                {grouped.map((group) => (
                  <CategorySection
                    key={group.name}
                    categoryName={group.name}
                    tasks={group.tasks}
                    defaultOpen
                    onEdit={(task) => {
                      setEditingTask(task);
                      setTaskDialogOpen(true);
                    }}
                    onComplete={setCompletingTask}
                    onDelete={setDeleteTaskId}
                    selectionMode={selectionMode}
                    selectedIds={selectedTaskIds}
                    onToggleSelect={toggleSelect}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>

      <TaskDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        planId={planId}
        task={editingTask}
        activeSectors={activeSectors}
      />

      <ConfirmDialog
        open={!!deleteTaskId}
        onOpenChange={() => setDeleteTaskId(null)}
        title="Eliminar tarea"
        description="¿Estás seguro de que querés eliminar esta tarea?"
        onConfirm={() => {
          if (deleteTaskId) {
            removeTask.mutate(
              { planId, taskId: deleteTaskId },
              { onSuccess: () => setDeleteTaskId(null) },
            );
          }
        }}
        isLoading={removeTask.isPending}
      />

      <ConfirmDialog
        open={!!statusTransition}
        onOpenChange={() => setStatusTransition(null)}
        title={statusTransition === PlanStatus.ACTIVE ? 'Activar plan' : 'Archivar plan'}
        description={
          statusTransition === PlanStatus.ACTIVE
            ? '¿Estás seguro de que querés activar este plan?'
            : '¿Estás seguro de que querés archivar este plan? Esta acción no se puede deshacer.'
        }
        onConfirm={() => {
          if (statusTransition) {
            updatePlan.mutate(
              { id: planId, status: statusTransition },
              { onSuccess: () => setStatusTransition(null) },
            );
          }
        }}
        isLoading={updatePlan.isPending}
      />

      <CompleteTaskDialog
        open={!!completingTask}
        onOpenChange={() => setCompletingTask(null)}
        task={completingTask}
        planId={planId}
      />

      <BulkCompleteDialog
        open={bulkCompleteOpen}
        onOpenChange={setBulkCompleteOpen}
        tasks={tasks.filter((t) => selectedTaskIds.has(t.id))}
        planId={planId}
        onDone={exitSelectionMode}
      />

      <Dialog
        open={templateDialogOpen}
        onOpenChange={(open) => {
          setTemplateDialogOpen(open);
          if (!open) setSelectedTemplateId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aplicar template de categoría</DialogTitle>
            <DialogDescription>
              Seleccioná un template para agregar todas sus tareas al plan de una vez.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-2">
            {categoryTemplates?.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => setSelectedTemplateId(tpl.id)}
                className={cn(
                  'flex items-center justify-between rounded-lg border p-3 text-left transition-colors',
                  selectedTemplateId === tpl.id
                    ? 'border-primary bg-primary/5'
                    : 'hover:bg-muted/50',
                )}
              >
                <div>
                  <p className="text-sm font-medium">{tpl.name}</p>
                  {tpl.description && (
                    <p className="text-muted-foreground text-xs">{tpl.description}</p>
                  )}
                </div>
                <span className="text-muted-foreground text-xs">
                  {tpl.tasks.length} tarea{tpl.tasks.length !== 1 ? 's' : ''}
                </span>
              </button>
            ))}
            {categoryTemplates?.length === 0 && (
              <p className="text-muted-foreground py-4 text-center text-sm">
                No hay templates disponibles.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTemplateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              disabled={!selectedTemplateId || bulkAdd.isPending}
              onClick={() => {
                if (selectedTemplateId) {
                  bulkAdd.mutate(
                    { planId, categoryTemplateId: selectedTemplateId },
                    {
                      onSuccess: () => {
                        setTemplateDialogOpen(false);
                        setSelectedTemplateId(null);
                      },
                    },
                  );
                }
              }}
            >
              {bulkAdd.isPending ? 'Aplicando...' : 'Aplicar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
