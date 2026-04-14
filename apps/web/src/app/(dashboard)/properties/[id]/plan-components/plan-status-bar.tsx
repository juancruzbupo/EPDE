import { PLAN_STATUS_LABELS, PlanStatus } from '@epde/shared';
import { Archive, LayoutTemplate, MoreVertical, Play, Plus } from 'lucide-react';
import React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface PlanStatusBarProps {
  planName: string;
  planStatus: PlanStatus;
  hasTasks: boolean;
  onActivate: () => void;
  onArchive: () => void;
  onApplyTemplate: () => void;
  onAddTask: () => void;
}

export const PlanStatusBar = React.memo(function PlanStatusBar({
  planName,
  planStatus,
  hasTasks,
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
        <Button size="sm" onClick={onAddTask}>
          <Plus className="mr-2 h-4 w-4" />
          Agregar Tarea
        </Button>
        {hasTasks && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" aria-label="Más acciones del plan">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={onApplyTemplate}>
                <LayoutTemplate className="mr-2 h-4 w-4" />
                Agregar desde plantilla
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </CardHeader>
  );
});
