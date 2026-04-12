import { PLAN_STATUS_LABELS, PlanStatus } from '@epde/shared';
import { Archive, LayoutTemplate, Play, Plus } from 'lucide-react';
import React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CardHeader, CardTitle } from '@/components/ui/card';

interface PlanStatusBarProps {
  planName: string;
  planStatus: PlanStatus;
  onActivate: () => void;
  onArchive: () => void;
  onApplyTemplate: () => void;
  onAddTask: () => void;
}

export const PlanStatusBar = React.memo(function PlanStatusBar({
  planName,
  planStatus,
  onActivate,
  onArchive,
  onApplyTemplate,
  onAddTask,
}: PlanStatusBarProps) {
  return (
    <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <CardTitle className="text-lg">{planName}</CardTitle>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <Badge variant="outline">{PLAN_STATUS_LABELS[planStatus] ?? planStatus}</Badge>
          {planStatus === PlanStatus.DRAFT && (
            <Button size="sm" variant="outline" onClick={onActivate}>
              <Play className="mr-1.5 h-3.5 w-3.5" />
              Activar Plan
            </Button>
          )}
          {planStatus === PlanStatus.ACTIVE && (
            <Button size="sm" variant="outline" onClick={onArchive}>
              <Archive className="mr-1.5 h-3.5 w-3.5" />
              Archivar Plan
            </Button>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={onApplyTemplate}>
          <LayoutTemplate className="mr-2 h-4 w-4" />
          Aplicar Template
        </Button>
        <Button size="sm" onClick={onAddTask}>
          <Plus className="mr-2 h-4 w-4" />
          Agregar Tarea
        </Button>
      </div>
    </CardHeader>
  );
});
