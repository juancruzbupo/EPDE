import { CheckCircle } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';

interface PlanBulkActionsBarProps {
  selectedCount: number;
  completableCount: number;
  onToggleSelectAll: () => void;
  onCancel: () => void;
  onBulkComplete: () => void;
}

export const PlanBulkActionsBar = React.memo(function PlanBulkActionsBar({
  selectedCount,
  completableCount,
  onToggleSelectAll,
  onCancel,
  onBulkComplete,
}: PlanBulkActionsBarProps) {
  return (
    <div className="bg-muted/50 flex items-center gap-3 rounded-lg p-2">
      <Button size="sm" variant="ghost" onClick={onToggleSelectAll}>
        {selectedCount === completableCount ? 'Deseleccionar todas' : 'Seleccionar todas'}
      </Button>
      <span className="text-muted-foreground text-sm">
        {selectedCount} seleccionada{selectedCount !== 1 ? 's' : ''}
      </span>
      <div className="flex-1" />
      <Button size="sm" variant="ghost" onClick={onCancel}>
        Cancelar
      </Button>
      <Button size="sm" disabled={selectedCount === 0} onClick={onBulkComplete}>
        <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
        Completar {selectedCount > 0 ? `(${selectedCount})` : ''}
      </Button>
    </div>
  );
});
