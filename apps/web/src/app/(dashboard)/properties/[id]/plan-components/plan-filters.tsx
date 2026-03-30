import { TASK_STATUS_LABELS, TaskPriority, TaskStatus } from '@epde/shared';
import { CheckCircle } from 'lucide-react';
import React from 'react';

import { SearchInput } from '@/components/search-input';
import { SearchableFilterSelect } from '@/components/searchable-filter-select';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const SHOW_SEARCH_THRESHOLD = 5;

const PRIORITY_OPTIONS: { value: TaskPriority | 'all'; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: TaskPriority.HIGH, label: 'Alta' },
  { value: TaskPriority.MEDIUM, label: 'Media' },
  { value: TaskPriority.LOW, label: 'Baja' },
];

const STATUS_OPTIONS: { value: TaskStatus | 'all' | 'actionable'; label: string }[] = [
  { value: 'actionable', label: 'Por inspeccionar' },
  { value: 'all', label: 'Todas' },
  { value: TaskStatus.OVERDUE, label: TASK_STATUS_LABELS.OVERDUE },
  { value: TaskStatus.PENDING, label: TASK_STATUS_LABELS.PENDING },
  { value: TaskStatus.UPCOMING, label: TASK_STATUS_LABELS.UPCOMING },
];

interface PlanFiltersProps {
  totalTaskCount: number;
  completableTaskCount: number;
  selectionMode: boolean;
  categoryOptions: { value: string; label: string }[];
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: TaskStatus | 'all' | 'actionable';
  onStatusFilterChange: (value: TaskStatus | 'all' | 'actionable') => void;
  priority: TaskPriority | 'all';
  onPriorityChange: (value: TaskPriority | 'all') => void;
  onEnterSelectionMode: () => void;
}

export const PlanFilters = React.memo(function PlanFilters({
  totalTaskCount,
  completableTaskCount,
  selectionMode,
  categoryOptions,
  categoryFilter,
  onCategoryFilterChange,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  priority,
  onPriorityChange,
  onEnterSelectionMode,
}: PlanFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {categoryOptions.length > 1 && (
        <SearchableFilterSelect
          value={categoryFilter}
          onChange={onCategoryFilterChange}
          options={categoryOptions}
          placeholder="Categoría"
        />
      )}
      {totalTaskCount >= SHOW_SEARCH_THRESHOLD && (
        <SearchInput value={search} onChange={onSearchChange} placeholder="Buscar tarea..." />
      )}
      <div className="flex flex-wrap gap-1">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onStatusFilterChange(opt.value)}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition-colors',
              statusFilter === opt.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80',
            )}
          >
            {opt.label}
          </button>
        ))}
        <span className="text-border mx-1">|</span>
        {PRIORITY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onPriorityChange(opt.value)}
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
      {completableTaskCount > 1 && !selectionMode && (
        <Button size="sm" variant="outline" onClick={onEnterSelectionMode}>
          <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
          Completar varias
        </Button>
      )}
    </div>
  );
});
