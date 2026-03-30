'use client';

import { PlanStatus, TaskPriority, TaskStatus } from '@epde/shared';
import { useCallback, useMemo, useState } from 'react';

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
import { StatusSummary } from './plan-components/status-summary';

const ACTIONABLE_STATUSES: TaskStatus[] = [
  TaskStatus.OVERDUE,
  TaskStatus.PENDING,
  TaskStatus.UPCOMING,
];

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
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all' | 'actionable'>('actionable');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [serviceDialogTask, setServiceDialogTask] = useState<{
    propertyId: string;
    taskId: string;
    title: string;
    description: string;
  } | null>(null);
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

  const handleEdit = useCallback((task: TaskPublic) => {
    setEditingTask(task);
    setTaskDialogOpen(true);
  }, []);

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

  const handleApplyTemplate = useCallback(() => {
    if (!selectedTemplateId) return;
    bulkAdd.mutate(
      { planId, categoryTemplateId: selectedTemplateId },
      {
        onSuccess: () => {
          setTemplateDialogOpen(false);
          setSelectedTemplateId(null);
        },
      },
    );
  }, [selectedTemplateId, bulkAdd, planId]);

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteTaskId) return;
    removeTask.mutate({ planId, taskId: deleteTaskId }, { onSuccess: () => setDeleteTaskId(null) });
  }, [deleteTaskId, removeTask, planId]);

  const handleStatusConfirm = useCallback(() => {
    if (!statusTransition) return;
    updatePlan.mutate(
      { id: planId, status: statusTransition },
      { onSuccess: () => setStatusTransition(null) },
    );
  }, [statusTransition, updatePlan, planId]);

  const handleProblemDetected = useCallback(
    (info: { taskId: string; taskName: string }) => {
      setServiceDialogTask({
        propertyId,
        taskId: info.taskId,
        title: `Solicitud: ${info.taskName}`,
        description: `Problema detectado en: ${info.taskName}`,
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
        onActivate={() => setStatusTransition(PlanStatus.ACTIVE)}
        onArchive={() => setStatusTransition(PlanStatus.ARCHIVED)}
        onApplyTemplate={() => setTemplateDialogOpen(true)}
        onAddTask={() => {
          setEditingTask(null);
          setTaskDialogOpen(true);
        }}
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
                onBulkComplete={() => setBulkCompleteOpen(true)}
              />
            )}
            <PlanTaskList
              filteredCount={filtered.length}
              grouped={grouped}
              onEdit={handleEdit}
              onComplete={setCompletingTask}
              onDelete={setDeleteTaskId}
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
        taskDialogOpen={taskDialogOpen}
        onTaskDialogChange={setTaskDialogOpen}
        editingTask={editingTask}
        deleteTaskId={deleteTaskId}
        onDeleteTaskChange={() => setDeleteTaskId(null)}
        onDeleteConfirm={handleDeleteConfirm}
        isDeleting={removeTask.isPending}
        statusTransition={statusTransition}
        onStatusTransitionChange={() => setStatusTransition(null)}
        onStatusConfirm={handleStatusConfirm}
        isUpdatingPlan={updatePlan.isPending}
        completingTask={completingTask}
        onCompletingTaskChange={() => setCompletingTask(null)}
        onProblemDetected={handleProblemDetected}
        serviceDialogTask={serviceDialogTask}
        onServiceDialogChange={(open) => {
          if (!open) setServiceDialogTask(null);
        }}
        bulkCompleteOpen={bulkCompleteOpen}
        onBulkCompleteChange={setBulkCompleteOpen}
        selectedTasks={tasks.filter((t) => selectedTaskIds.has(t.id))}
        onBulkCompleteDone={exitSelectionMode}
        templateDialogOpen={templateDialogOpen}
        onTemplateDialogChange={(open) => {
          setTemplateDialogOpen(open);
          if (!open) setSelectedTemplateId(null);
        }}
        categoryTemplates={categoryTemplates}
        selectedTemplateId={selectedTemplateId}
        onSelectTemplate={setSelectedTemplateId}
        onApplyTemplate={handleApplyTemplate}
        isApplyingTemplate={bulkAdd.isPending}
      />
    </Card>
  );
}
