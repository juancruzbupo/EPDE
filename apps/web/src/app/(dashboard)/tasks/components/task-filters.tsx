import type { PropertySector } from '@epde/shared';
import { PROPERTY_SECTOR_LABELS, TaskPriority } from '@epde/shared';
import React from 'react';

import { SearchInput } from '@/components/search-input';
import { SearchableFilterSelect } from '@/components/searchable-filter-select';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
    <div className="mb-4 space-y-3">
      {/* Search row */}
      <div className="flex flex-wrap items-center gap-3">
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
          className="w-full sm:w-auto sm:min-w-[360px]"
        />
      </div>

      {/* Filter row — priority pills + sector select, single line */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
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

        {/* Sector — Select on mobile, pills on desktop */}
        <Select
          value={sectorFilter}
          onValueChange={(v) => onSectorChange(v as PropertySector | 'all')}
        >
          <SelectTrigger
            className="bg-muted h-auto w-auto gap-1 rounded-full border-0 px-3 py-1 text-xs sm:hidden"
            aria-label="Filtrar por sector"
          >
            <span className="text-muted-foreground">Sector:</span>
            <span className="font-medium">
              <SelectValue />
            </span>
          </SelectTrigger>
          <SelectContent>
            {SECTOR_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="hidden flex-wrap gap-1 sm:flex">
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
