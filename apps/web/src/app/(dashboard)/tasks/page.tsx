'use client';

import type { TaskListItem, TaskPublic } from '@epde/shared';
import type { PropertySector } from '@epde/shared';
import { TaskPriority, TaskStatus } from '@epde/shared';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { PageHeader } from '@/components/page-header';
import { PageTransition } from '@/components/ui/page-transition';
import { useDebounce } from '@/hooks/use-debounce';
import { useAllTasks } from '@/hooks/use-plans';
import { useTaskDetail } from '@/hooks/use-task-operations';
import { TASK_STATUS_ORDER } from '@/lib/style-maps';

import { CompleteTaskDialog } from '../properties/[id]/complete-task-dialog';
import { TaskDetailSheet } from '../properties/[id]/task-detail-sheet';
import { CreateServiceDialog } from '../service-requests/create-service-dialog';
import { TaskFilters } from './components/task-filters';
import { TaskGroupedList } from './components/task-grouped-list';
import { TaskStatCards } from './components/task-stat-cards';

export default function TasksPage() {
  useEffect(() => {
    document.title = 'Tareas | EPDE';
  }, []);

  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState<TaskPriority | 'all'>('all');
  const [sectorFilter, setSectorFilter] = useState<PropertySector | 'all'>('all');
  const [propertyFilter, setPropertyFilter] = useState<string>('all');
  const [activeStatus, setActiveStatus] = useState<TaskStatus | null>(null);
  const debouncedSearch = useDebounce(search);

  // Task detail sheet state
  const [selectedTask, setSelectedTask] = useState<TaskListItem | null>(null);
  const [completingTask, setCompletingTask] = useState<TaskPublic | null>(null);

  // Service / budget dialog state (pre-filled from task detail sheet)
  const [serviceDialogTask, setServiceDialogTask] = useState<{
    propertyId: string;
    taskId: string;
    title: string;
    description: string;
  } | null>(null);
  const searchParams = useSearchParams();
  // Server-side status filtering: pass status to API when stat card is active.
  // Stat counts always use the full dataset (no status filter).
  const serverParams = activeStatus ? { status: activeStatus } : undefined;
  const { data: tasks, isLoading, isError, refetch } = useAllTasks(serverParams);
  const { data: allTasksForCounts } = useAllTasks();

  // Auto-open task detail when navigating with ?taskId=xxx (e.g. from dashboard ActionList)
  // If ?action=complete, also auto-open the complete dialog
  const handledTaskId = useRef<string | null>(null);
  useEffect(() => {
    const taskId = searchParams.get('taskId');
    const action = searchParams.get('action');
    if (taskId && tasks && taskId !== handledTaskId.current) {
      const found = tasks.find((t) => t.id === taskId);
      if (found) {
        setSelectedTask(found);
        handledTaskId.current = taskId;
        if (action === 'complete') {
          // Defer to allow task detail to load first
          setTimeout(() => setCompletingTask(found as unknown as TaskPublic), 300);
        }
      }
    }
  }, [searchParams, tasks]);

  // Fetch full task detail when a task is selected
  const { data: taskDetail } = useTaskDetail(
    selectedTask?.maintenancePlan.id ?? '',
    selectedTask?.id ?? '',
  );

  const propertyOptions = useMemo(() => {
    if (!tasks) return [];
    const seen = new Map<string, string>();
    for (const t of tasks) {
      const p = t.maintenancePlan.property;
      if (!seen.has(p.id)) seen.set(p.id, p.address);
    }
    return [...seen.entries()].map(([id, address]) => ({ value: id, label: address }));
  }, [tasks]);

  const filtered = useMemo(() => {
    if (!tasks) return [];
    let result = tasks;

    if (propertyFilter !== 'all') {
      result = result.filter((t) => t.maintenancePlan.property.id === propertyFilter);
    }

    if (priority !== 'all') {
      result = result.filter((t) => t.priority === priority);
    }

    if (sectorFilter !== 'all') {
      result = result.filter((t) => t.sector === sectorFilter);
    }

    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.category.name.toLowerCase().includes(q) ||
          t.maintenancePlan.property.address.toLowerCase().includes(q) ||
          t.maintenancePlan.property.city.toLowerCase().includes(q),
      );
    }

    return result;
  }, [tasks, propertyFilter, priority, sectorFilter, debouncedSearch]);

  const grouped = useMemo(() => {
    const map = new Map<TaskStatus, TaskListItem[]>();
    for (const s of TASK_STATUS_ORDER) map.set(s, []);
    for (const task of filtered) {
      map.get(task.status)?.push(task);
    }
    return map;
  }, [filtered]);

  /** Stat card counts — always from full dataset, independent of active status filter. */
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of TASK_STATUS_ORDER) counts[s] = 0;
    if (allTasksForCounts) {
      for (const t of allTasksForCounts) {
        if (t.status in counts) counts[t.status] = (counts[t.status] ?? 0) + 1;
      }
    }
    return counts;
  }, [allTasksForCounts]);

  /** Tasks to display — all or filtered by clicked stat card. */
  const displayStatuses = activeStatus ? [activeStatus] : TASK_STATUS_ORDER;

  const handleTaskClick = useCallback((task: TaskListItem) => {
    setSelectedTask(task);
  }, []);

  const toggleStatus = useCallback((status: TaskStatus) => {
    setActiveStatus((prev) => (prev === status ? null : status));
  }, []);

  const hasActiveFilters = !!(debouncedSearch || priority !== 'all' || activeStatus);

  return (
    <PageTransition>
      <PageHeader
        title="Tareas"
        description="Seguimiento de todas las tareas de mantenimiento de tus propiedades."
      />

      <TaskStatCards
        isLoading={isLoading || !tasks}
        statusCounts={statusCounts}
        activeStatus={activeStatus}
        onToggleStatus={toggleStatus}
      />

      <TaskFilters
        search={search}
        onSearchChange={setSearch}
        priority={priority}
        onPriorityChange={setPriority}
        sectorFilter={sectorFilter}
        onSectorChange={setSectorFilter}
        propertyFilter={propertyFilter}
        onPropertyChange={setPropertyFilter}
        propertyOptions={propertyOptions}
      />

      <TaskGroupedList
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        filtered={filtered}
        grouped={grouped}
        displayStatuses={displayStatuses}
        hasActiveFilters={hasActiveFilters}
        onTaskClick={handleTaskClick}
      />

      {/* Task detail sheet — loads full task detail on demand */}
      <TaskDetailSheet
        open={!!selectedTask}
        onOpenChange={(open) => {
          if (!open) setSelectedTask(null);
        }}
        task={taskDetail ?? null}
        planId={selectedTask?.maintenancePlan.id ?? ''}
        onComplete={(task) => {
          setCompletingTask(task);
        }}
        onRequestService={() => {
          if (!selectedTask) return;
          setServiceDialogTask({
            propertyId: selectedTask.maintenancePlan.property.id,
            taskId: selectedTask.id,
            title: `Solicitud: ${selectedTask.name}`,
            description: `Tarea: ${selectedTask.name} — ${selectedTask.category.name}`,
          });
        }}
      />

      <CompleteTaskDialog
        open={!!completingTask}
        onOpenChange={() => setCompletingTask(null)}
        task={completingTask}
        planId={selectedTask?.maintenancePlan.id ?? completingTask?.maintenancePlanId ?? ''}
        onProblemDetected={(info) => {
          if (!selectedTask) return;
          setServiceDialogTask({
            propertyId: selectedTask.maintenancePlan.property.id,
            taskId: info.taskId,
            title: `Solicitud: ${info.taskName}`,
            description: `Problema detectado en: ${info.taskName} — ${selectedTask.category.name}`,
          });
        }}
      />

      <CreateServiceDialog
        open={!!serviceDialogTask}
        onOpenChange={(open) => {
          if (!open) setServiceDialogTask(null);
        }}
        defaultPropertyId={serviceDialogTask?.propertyId}
        defaultTaskId={serviceDialogTask?.taskId}
        defaultTitle={serviceDialogTask?.title}
        defaultDescription={serviceDialogTask?.description}
      />
    </PageTransition>
  );
}
