'use client';

import { PlanStatus, TaskPriority, TaskStatus } from '@epde/shared';
import { useCallback, useMemo, useReducer, useState } from 'react';

import { ErrorState } from '@/components/error-state';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCategoryTemplates } from '@/hooks/use-category-templates';
import { useDebounce } from '@/hooks/use-debounce';
import { usePlan, useUpdatePlan } from '@/hooks/use-plans';
import { useBulkAddTasks, useRemoveTask, useReorderTasks } from '@/hooks/use-task-operations';
import type { TaskPublic } from '@/lib/api/maintenance-plans';

import { isCompletable } from './category-section';
import { PlanBulkActionsBar } from './plan-components/plan-bulk-actions-bar';
import { PlanDialogs } from './plan-components/plan-dialogs';
import { PlanFilters } from './plan-components/plan-filters';
import { PlanStatusBar } from './plan-components/plan-status-bar';
import { PlanTaskList } from './plan-components/plan-task-list';
import { PlanValidationDialog } from './plan-components/plan-validation-dialog';
import { StatusSummary } from './plan-components/status-summary';

const ACTIONABLE_STATUSES: TaskStatus[] = [
  TaskStatus.OVERDUE,
  TaskStatus.PENDING,
  TaskStatus.UPCOMING,
];

// ─── Dialog state reducer ────────────────────────────────

interface ServiceDialogInfo {
  propertyId: string;
  taskId: string;
  title: string;
  description: string;
}

interface DialogState {
  task: { open: boolean; editing: TaskPublic | null };
  delete: { taskId: string | null };
  complete: { task: TaskPublic | null };
  status: { transition: PlanStatus | null };
  validation: { open: boolean };
  template: { open: boolean; applying: boolean };
  bulkComplete: { open: boolean };
  service: { info: ServiceDialogInfo | null };
}

const initialDialogState: DialogState = {
  task: { open: false, editing: null },
  delete: { taskId: null },
  complete: { task: null },
  status: { transition: null },
  validation: { open: false },
  template: { open: false, applying: false },
  bulkComplete: { open: false },
  service: { info: null },
};

type DialogAction =
  | { type: 'OPEN_NEW_TASK' }
  | { type: 'OPEN_EDIT_TASK'; task: TaskPublic }
  | { type: 'CLOSE_TASK' }
  | { type: 'OPEN_DELETE'; taskId: string }
  | { type: 'CLOSE_DELETE' }
  | { type: 'OPEN_COMPLETE'; task: TaskPublic }
  | { type: 'CLOSE_COMPLETE' }
  | { type: 'OPEN_STATUS'; transition: PlanStatus }
  | { type: 'CLOSE_STATUS' }
  | { type: 'OPEN_VALIDATION' }
  | { type: 'CLOSE_VALIDATION' }
  | { type: 'OPEN_TEMPLATE' }
  | { type: 'CLOSE_TEMPLATE' }
  | { type: 'SET_TEMPLATE_APPLYING'; applying: boolean }
  | { type: 'OPEN_BULK_COMPLETE' }
  | { type: 'CLOSE_BULK_COMPLETE' }
  | { type: 'OPEN_SERVICE'; info: ServiceDialogInfo }
  | { type: 'CLOSE_SERVICE' };

function dialogReducer(state: DialogState, action: DialogAction): DialogState {
  switch (action.type) {
    case 'OPEN_NEW_TASK':
      return { ...state, task: { open: true, editing: null } };
    case 'OPEN_EDIT_TASK':
      return { ...state, task: { open: true, editing: action.task } };
    case 'CLOSE_TASK':
      return { ...state, task: { open: false, editing: null } };
    case 'OPEN_DELETE':
      return { ...state, delete: { taskId: action.taskId } };
    case 'CLOSE_DELETE':
      return { ...state, delete: { taskId: null } };
    case 'OPEN_COMPLETE':
      return { ...state, complete: { task: action.task } };
    case 'CLOSE_COMPLETE':
      return { ...state, complete: { task: null } };
    case 'OPEN_STATUS':
      return { ...state, status: { transition: action.transition } };
    case 'CLOSE_STATUS':
      return { ...state, status: { transition: null } };
    case 'OPEN_VALIDATION':
      return { ...state, validation: { open: true } };
    case 'CLOSE_VALIDATION':
      return { ...state, validation: { open: false } };
    case 'OPEN_TEMPLATE':
      return { ...state, template: { open: true, applying: false } };
    case 'CLOSE_TEMPLATE':
      return { ...state, template: { open: false, applying: false } };
    case 'SET_TEMPLATE_APPLYING':
      return { ...state, template: { ...state.template, applying: action.applying } };
    case 'OPEN_BULK_COMPLETE':
      return { ...state, bulkComplete: { open: true } };
    case 'CLOSE_BULK_COMPLETE':
      return { ...state, bulkComplete: { open: false } };
    case 'OPEN_SERVICE':
      return { ...state, service: { info: action.info } };
    case 'CLOSE_SERVICE':
      return { ...state, service: { info: null } };
  }
}

// ─── Component ───────────────────────────────────────────

interface PlanEditorProps {
  propertyId: string;
  planId: string;
  activeSectors?: string[];
}

export function PlanEditor({ propertyId, planId, activeSectors }: PlanEditorProps) {
  const { data: plan, isLoading, isError, refetch } = usePlan(planId);
  const removeTask = useRemoveTask();
  const reorderTasks = useReorderTasks();
  const updatePlan = useUpdatePlan();
  const bulkAdd = useBulkAddTasks();
  const { data: categoryTemplates } = useCategoryTemplates();

  const [dialogs, dispatch] = useReducer(dialogReducer, initialDialogState);

  // Filter & selection state (kept as useState — simple primitives)
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState<TaskPriority | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all' | 'actionable'>('actionable');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const debouncedSearch = useDebounce(search);

  const tasks = plan?.tasks ?? [];
  const completableTasks = useMemo(() => tasks.filter(isCompletable), [tasks]);

  const handleMoveTask = useCallback(
    (taskId: string, direction: 'up' | 'down') => {
      const allTasks = plan?.tasks ?? [];
      const idx = allTasks.findIndex((t) => t.id === taskId);
      if (idx < 0) return;
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= allTasks.length) return;
      const reordered = allTasks.map((t, i) => ({
        id: t.id,
        order:
          i === idx ? allTasks[swapIdx]!.order : i === swapIdx ? allTasks[idx]!.order : t.order,
      }));
      reorderTasks.mutate({ planId, tasks: reordered });
    },
    [plan?.tasks, planId, reorderTasks],
  );

  const toggleSelect = useCallback((taskId: string) => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  }, []);

  const handleEdit = useCallback(
    (task: TaskPublic) => dispatch({ type: 'OPEN_EDIT_TASK', task }),
    [],
  );

  const exitSelectionMode = useCallback(() => {
    setSelectionMode(false);
    setSelectedTaskIds(new Set());
  }, []);

  const categoryOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const t of tasks) {
      if (!seen.has(t.category.id)) seen.set(t.category.id, t.category.name);
    }
    return [...seen.entries()].map(([id, name]) => ({ value: id, label: name }));
  }, [tasks]);

  const filtered = useMemo(() => {
    let result = tasks;
    if (categoryFilter !== 'all') result = result.filter((t) => t.category.id === categoryFilter);
    if (statusFilter === 'actionable') {
      result = result.filter((t) => ACTIONABLE_STATUSES.includes(t.status));
    } else if (statusFilter !== 'all') {
      result = result.filter((t) => t.status === statusFilter);
    }
    if (priority !== 'all') result = result.filter((t) => t.priority === priority);
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter((t) => t.name.toLowerCase().includes(q));
    }
    return result;
  }, [tasks, categoryFilter, statusFilter, priority, debouncedSearch]);

  const grouped = useMemo(() => {
    const map = new Map<string, { name: string; tasks: TaskPublic[] }>();
    for (const task of filtered) {
      const existing = map.get(task.category.id);
      if (existing) existing.tasks.push(task);
      else map.set(task.category.id, { name: task.category.name, tasks: [task] });
    }
    return Array.from(map.values());
  }, [filtered]);

  const handleToggleSelectAll = useCallback(() => {
    const ids = completableTasks.map((t) => t.id);
    setSelectedTaskIds((prev) => (prev.size === ids.length ? new Set() : new Set(ids)));
  }, [completableTasks]);

  const handleApplyTemplates = useCallback(
    async (templateIds: string[]) => {
      dispatch({ type: 'SET_TEMPLATE_APPLYING', applying: true });
      for (const id of templateIds) {
        await new Promise<void>((resolve, reject) => {
          bulkAdd.mutate(
            { planId, categoryTemplateId: id },
            { onSuccess: () => resolve(), onError: () => reject() },
          );
        });
      }
      dispatch({ type: 'CLOSE_TEMPLATE' });
    },
    [bulkAdd, planId],
  );

  const handleDeleteConfirm = useCallback(() => {
    if (!dialogs.delete.taskId) return;
    removeTask.mutate(
      { planId, taskId: dialogs.delete.taskId },
      { onSuccess: () => dispatch({ type: 'CLOSE_DELETE' }) },
    );
  }, [dialogs.delete.taskId, removeTask, planId]);

  const handleStatusConfirm = useCallback(() => {
    if (!dialogs.status.transition) return;
    updatePlan.mutate(
      { id: planId, status: dialogs.status.transition },
      { onSuccess: () => dispatch({ type: 'CLOSE_STATUS' }) },
    );
  }, [dialogs.status.transition, updatePlan, planId]);

  const handleProblemDetected = useCallback(
    (info: { taskId: string; taskName: string }) => {
      dispatch({
        type: 'OPEN_SERVICE',
        info: {
          propertyId,
          taskId: info.taskId,
          title: `Solicitud: ${info.taskName}`,
          description: `Problema detectado en: ${info.taskName}`,
        },
      });
    },
    [propertyId],
  );

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
      <PlanStatusBar
        planName={plan.name}
        planStatus={plan.status}
        onActivate={() => dispatch({ type: 'OPEN_VALIDATION' })}
        onArchive={() => dispatch({ type: 'OPEN_STATUS', transition: PlanStatus.ARCHIVED })}
        onApplyTemplate={() => dispatch({ type: 'OPEN_TEMPLATE' })}
        onAddTask={() => dispatch({ type: 'OPEN_NEW_TASK' })}
      />
      <CardContent>
        {tasks.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">
            No hay tareas en este plan. Agregá una para comenzar.
          </p>
        ) : (
          <div className="space-y-4">
            <StatusSummary tasks={tasks} />
            <PlanFilters
              totalTaskCount={tasks.length}
              completableTaskCount={completableTasks.length}
              selectionMode={selectionMode}
              categoryOptions={categoryOptions}
              categoryFilter={categoryFilter}
              onCategoryFilterChange={setCategoryFilter}
              search={search}
              onSearchChange={setSearch}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              priority={priority}
              onPriorityChange={setPriority}
              onEnterSelectionMode={() => setSelectionMode(true)}
            />
            {selectionMode && (
              <PlanBulkActionsBar
                selectedCount={selectedTaskIds.size}
                completableCount={completableTasks.length}
                onToggleSelectAll={handleToggleSelectAll}
                onCancel={exitSelectionMode}
                onBulkComplete={() => dispatch({ type: 'OPEN_BULK_COMPLETE' })}
              />
            )}
            <PlanTaskList
              filteredCount={filtered.length}
              grouped={grouped}
              onEdit={handleEdit}
              onComplete={(task) => dispatch({ type: 'OPEN_COMPLETE', task })}
              onDelete={(taskId) => dispatch({ type: 'OPEN_DELETE', taskId })}
              onMove={handleMoveTask}
              selectionMode={selectionMode}
              selectedIds={selectedTaskIds}
              onToggleSelect={toggleSelect}
            />
          </div>
        )}
      </CardContent>

      <PlanDialogs
        planId={planId}
        propertyId={propertyId}
        activeSectors={activeSectors}
        taskDialogOpen={dialogs.task.open}
        onTaskDialogChange={(open) => {
          if (!open) dispatch({ type: 'CLOSE_TASK' });
        }}
        editingTask={dialogs.task.editing}
        deleteTaskId={dialogs.delete.taskId}
        onDeleteTaskChange={() => dispatch({ type: 'CLOSE_DELETE' })}
        onDeleteConfirm={handleDeleteConfirm}
        isDeleting={removeTask.isPending}
        statusTransition={dialogs.status.transition}
        onStatusTransitionChange={() => dispatch({ type: 'CLOSE_STATUS' })}
        onStatusConfirm={handleStatusConfirm}
        isUpdatingPlan={updatePlan.isPending}
        completingTask={dialogs.complete.task}
        onCompletingTaskChange={() => dispatch({ type: 'CLOSE_COMPLETE' })}
        onProblemDetected={handleProblemDetected}
        serviceDialogTask={dialogs.service.info}
        onServiceDialogChange={(open) => {
          if (!open) dispatch({ type: 'CLOSE_SERVICE' });
        }}
        bulkCompleteOpen={dialogs.bulkComplete.open}
        onBulkCompleteChange={(open) => {
          if (!open) dispatch({ type: 'CLOSE_BULK_COMPLETE' });
        }}
        selectedTasks={tasks.filter((t) => selectedTaskIds.has(t.id))}
        onBulkCompleteDone={exitSelectionMode}
        templateDialogOpen={dialogs.template.open}
        onTemplateDialogChange={(open) => {
          if (!open) dispatch({ type: 'CLOSE_TEMPLATE' });
        }}
        categoryTemplates={categoryTemplates}
        onApplyTemplates={handleApplyTemplates}
        isApplyingTemplate={dialogs.template.applying}
      />
      <PlanValidationDialog
        open={dialogs.validation.open}
        onOpenChange={(open) => {
          if (!open) dispatch({ type: 'CLOSE_VALIDATION' });
        }}
        tasks={tasks}
        activeSectors={activeSectors}
        onConfirm={() => {
          dispatch({ type: 'CLOSE_VALIDATION' });
          dispatch({ type: 'OPEN_STATUS', transition: PlanStatus.ACTIVE });
        }}
        isLoading={updatePlan.isPending}
      />
    </Card>
  );
}
