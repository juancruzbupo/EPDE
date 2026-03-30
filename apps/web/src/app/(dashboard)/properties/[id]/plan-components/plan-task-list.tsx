import React from 'react';

import type { TaskPublic } from '@/lib/api/maintenance-plans';

import { CategorySection } from '../category-section';

interface GroupedCategory {
  name: string;
  tasks: TaskPublic[];
}

interface PlanTaskListProps {
  filteredCount: number;
  grouped: GroupedCategory[];
  onEdit: (task: TaskPublic) => void;
  onComplete: (task: TaskPublic) => void;
  onDelete: (taskId: string) => void;
  onMove: (taskId: string, direction: 'up' | 'down') => void;
  selectionMode: boolean;
  selectedIds: Set<string>;
  onToggleSelect: (taskId: string) => void;
}

export const PlanTaskList = React.memo(function PlanTaskList({
  filteredCount,
  grouped,
  onEdit,
  onComplete,
  onDelete,
  onMove,
  selectionMode,
  selectedIds,
  onToggleSelect,
}: PlanTaskListProps) {
  if (filteredCount === 0) {
    return (
      <p className="text-muted-foreground py-4 text-center text-sm">
        No se encontraron tareas con esa búsqueda.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        {filteredCount} tarea{filteredCount !== 1 ? 's' : ''}
        {grouped.length > 1 && ` en ${grouped.length} categorías`}
      </p>
      {grouped.map((group) => (
        <CategorySection
          key={group.name}
          categoryName={group.name}
          tasks={group.tasks}
          defaultOpen
          onEdit={onEdit}
          onComplete={onComplete}
          onDelete={onDelete}
          onMove={onMove}
          selectionMode={selectionMode}
          selectedIds={selectedIds}
          onToggleSelect={onToggleSelect}
        />
      ))}
    </div>
  );
});
