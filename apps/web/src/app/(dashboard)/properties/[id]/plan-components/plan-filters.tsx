import { TASK_STATUS_LABELS, TaskPriority, TaskStatus } from '@epde/shared';
import { CheckCircle, SlidersHorizontal, X } from 'lucide-react';
import React from 'react';

import { SearchInput } from '@/components/search-input';
import { SearchableFilterSelect } from '@/components/searchable-filter-select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  { value: TaskStatus.UPCOMING, label: TASK_STATUS_LABELS.UPCOMING },
  { value: TaskStatus.PENDING, label: TASK_STATUS_LABELS.PENDING },
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
  const showSearch = totalTaskCount >= SHOW_SEARCH_THRESHOLD;

  const activeFilters: { label: string; onClear: () => void }[] = [];
  if (statusFilter !== 'actionable') {
    const opt = STATUS_OPTIONS.find((o) => o.value === statusFilter);
    activeFilters.push({
      label: `Estado: ${opt?.label ?? statusFilter}`,
      onClear: () => onStatusFilterChange('actionable'),
    });
  }
  if (priority !== 'all') {
    const opt = PRIORITY_OPTIONS.find((o) => o.value === priority);
    activeFilters.push({
      label: `Prioridad: ${opt?.label ?? priority}`,
      onClear: () => onPriorityChange('all'),
    });
  }
  if (categoryFilter !== 'all') {
    const opt = categoryOptions.find((o) => o.value === categoryFilter);
    activeFilters.push({
      label: `Categoría: ${opt?.label ?? categoryFilter}`,
      onClear: () => onCategoryFilterChange('all'),
    });
  }

  const clearAll = () => {
    onStatusFilterChange('actionable');
    onPriorityChange('all');
    onCategoryFilterChange('all');
    onSearchChange('');
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {showSearch && (
          <SearchInput
            value={search}
            onChange={onSearchChange}
            placeholder="Buscar tarea..."
            className="w-full sm:w-auto sm:min-w-[280px] sm:flex-1"
          />
        )}

        <div className="flex items-center gap-2">
          <SlidersHorizontal className="text-muted-foreground hidden h-4 w-4 sm:block" />

          <Select
            value={statusFilter}
            onValueChange={(v) => onStatusFilterChange(v as TaskStatus | 'all' | 'actionable')}
          >
            <SelectTrigger
              className="h-9 w-auto min-w-[150px] gap-1.5 text-sm"
              aria-label="Filtrar por estado"
            >
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={priority}
            onValueChange={(v) => onPriorityChange(v as TaskPriority | 'all')}
          >
            <SelectTrigger
              className="h-9 w-auto min-w-[120px] gap-1.5 text-sm"
              aria-label="Filtrar por prioridad"
            >
              <SelectValue placeholder="Prioridad" />
            </SelectTrigger>
            <SelectContent>
              {PRIORITY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.value === 'all' ? 'Toda prioridad' : opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {categoryOptions.length > 1 && (
            <SearchableFilterSelect
              value={categoryFilter}
              onChange={onCategoryFilterChange}
              options={categoryOptions}
              placeholder="Categoría"
            />
          )}
        </div>

        {completableTaskCount > 1 && !selectionMode && (
          <Button size="sm" variant="outline" onClick={onEnterSelectionMode} className="sm:ml-auto">
            <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
            Completar varias
          </Button>
        )}
      </div>

      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {activeFilters.map((f) => (
            <Badge
              key={f.label}
              variant="secondary"
              className="gap-1 py-1 pr-1.5 pl-2.5 font-normal"
            >
              {f.label}
              <button
                onClick={f.onClear}
                className="text-muted-foreground hover:text-foreground rounded-full p-0.5 transition-colors"
                aria-label={`Quitar filtro: ${f.label}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="text-muted-foreground h-auto px-2 py-1 text-xs"
          >
            Limpiar todo
          </Button>
        </div>
      )}
    </div>
  );
});
