import type { PropertySector } from '@epde/shared';
import { PROPERTY_SECTOR_LABELS, TaskPriority } from '@epde/shared';
import { SlidersHorizontal, X } from 'lucide-react';
import React from 'react';

import { SearchInput } from '@/components/search-input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const PRIORITY_OPTIONS: { value: TaskPriority | 'all'; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: TaskPriority.HIGH, label: 'Alta' },
  { value: TaskPriority.MEDIUM, label: 'Media' },
  { value: TaskPriority.LOW, label: 'Baja' },
];

const SECTOR_OPTIONS: { value: PropertySector | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos los sectores' },
  ...(Object.keys(PROPERTY_SECTOR_LABELS) as PropertySector[]).map((value) => ({
    value,
    label: PROPERTY_SECTOR_LABELS[value],
  })),
];

export interface PlanFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  showSearch: boolean;
  priority: TaskPriority | 'all';
  onPriorityChange: (value: TaskPriority | 'all') => void;
  sectorFilter: PropertySector | 'all';
  onSectorChange: (value: PropertySector | 'all') => void;
}

export const PlanFilters = React.memo(function PlanFilters({
  search,
  onSearchChange,
  showSearch,
  priority,
  onPriorityChange,
  sectorFilter,
  onSectorChange,
}: PlanFiltersProps) {
  const activeFilters: { label: string; onClear: () => void }[] = [];

  if (priority !== 'all') {
    const opt = PRIORITY_OPTIONS.find((o) => o.value === priority);
    activeFilters.push({
      label: `Prioridad: ${opt?.label ?? priority}`,
      onClear: () => onPriorityChange('all'),
    });
  }
  if (sectorFilter !== 'all') {
    activeFilters.push({
      label: PROPERTY_SECTOR_LABELS[sectorFilter] ?? sectorFilter,
      onClear: () => onSectorChange('all'),
    });
  }

  const clearAll = () => {
    onPriorityChange('all');
    onSectorChange('all');
    onSearchChange('');
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {showSearch && (
          <SearchInput
            value={search}
            onChange={onSearchChange}
            placeholder="Buscar tarea o categoría..."
            className="w-full sm:w-auto sm:min-w-[280px] sm:flex-1"
          />
        )}

        <div className="flex items-center gap-2">
          <SlidersHorizontal className="text-muted-foreground hidden h-4 w-4 sm:block" />

          <Select
            value={priority === 'all' ? 'all' : priority}
            onValueChange={(v) => onPriorityChange(v as TaskPriority | 'all')}
          >
            <SelectTrigger
              className="h-9 w-full gap-1.5 text-sm sm:w-auto sm:min-w-[120px]"
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

          <Select
            value={sectorFilter}
            onValueChange={(v) => onSectorChange(v as PropertySector | 'all')}
          >
            <SelectTrigger
              className="h-9 w-full gap-1.5 text-sm sm:w-auto sm:min-w-[140px]"
              aria-label="Filtrar por sector"
            >
              <SelectValue placeholder="Sector" />
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
