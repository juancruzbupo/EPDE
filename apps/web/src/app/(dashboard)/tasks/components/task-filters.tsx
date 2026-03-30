import type { PropertySector } from '@epde/shared';
import { PROPERTY_SECTOR_LABELS, TaskPriority } from '@epde/shared';
import React from 'react';

import { SearchInput } from '@/components/search-input';
import { SearchableFilterSelect } from '@/components/searchable-filter-select';
import { cn } from '@/lib/utils';

const PRIORITY_OPTIONS: { value: TaskPriority | 'all'; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: TaskPriority.HIGH, label: 'Alta' },
  { value: TaskPriority.MEDIUM, label: 'Media' },
  { value: TaskPriority.LOW, label: 'Baja' },
];

const SECTOR_OPTIONS: { value: PropertySector | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  ...(Object.keys(PROPERTY_SECTOR_LABELS) as PropertySector[]).map((value) => ({
    value,
    label: PROPERTY_SECTOR_LABELS[value],
  })),
];

export interface TaskFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  priority: TaskPriority | 'all';
  onPriorityChange: (value: TaskPriority | 'all') => void;
  sectorFilter: PropertySector | 'all';
  onSectorChange: (value: PropertySector | 'all') => void;
  propertyFilter: string;
  onPropertyChange: (value: string) => void;
  propertyOptions: { value: string; label: string }[];
}

export const TaskFilters = React.memo(function TaskFilters({
  search,
  onSearchChange,
  priority,
  onPriorityChange,
  sectorFilter,
  onSectorChange,
  propertyFilter,
  onPropertyChange,
  propertyOptions,
}: TaskFiltersProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      {propertyOptions.length > 1 && (
        <SearchableFilterSelect
          value={propertyFilter}
          onChange={onPropertyChange}
          options={propertyOptions}
          placeholder="Propiedad"
        />
      )}
      <SearchInput
        value={search}
        onChange={onSearchChange}
        placeholder="Buscar tarea, categoría o dirección..."
        className="min-w-[360px]"
      />
      <div className="flex gap-1">
        {PRIORITY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            aria-pressed={priority === opt.value}
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
      <div className="flex gap-1 overflow-x-auto">
        {SECTOR_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            aria-pressed={sectorFilter === opt.value}
            onClick={() => onSectorChange(opt.value)}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap transition-colors',
              sectorFilter === opt.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80',
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
});
