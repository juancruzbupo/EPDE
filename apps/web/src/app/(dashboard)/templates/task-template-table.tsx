import type { TaskTemplate } from '@epde/shared';
import {
  PRIORITY_VARIANT,
  PROFESSIONAL_REQUIREMENT_LABELS,
  PROPERTY_SECTOR_LABELS,
  RECURRENCE_TYPE_LABELS,
  TASK_PRIORITY_LABELS,
  TASK_TYPE_LABELS,
} from '@epde/shared';
import { Pencil, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PROFESSIONAL_REQ_COLORS, TASK_TYPE_COLORS } from '@/lib/style-maps';

interface TaskTemplateTableProps {
  tasks: TaskTemplate[];
  onEdit: (task: TaskTemplate) => void;
  onDelete: (taskId: string) => void;
}

export function TaskTemplateTable({ tasks, onEdit, onDelete }: TaskTemplateTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>#</TableHead>
          <TableHead>Nombre</TableHead>
          <TableHead>Sector</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Profesional</TableHead>
          <TableHead>Prioridad</TableHead>
          <TableHead>Recurrencia</TableHead>
          <TableHead className="w-20">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.map((task) => (
          <TableRow key={task.id}>
            <TableCell className="text-muted-foreground text-xs">{task.displayOrder}</TableCell>
            <TableCell className="font-medium">{task.name}</TableCell>
            <TableCell className="text-muted-foreground text-xs">
              {task.defaultSector
                ? (PROPERTY_SECTOR_LABELS[task.defaultSector] ?? task.defaultSector)
                : '—'}
            </TableCell>
            <TableCell>
              <span
                className={`rounded px-1.5 py-0.5 text-xs ${TASK_TYPE_COLORS[task.taskType] ?? ''}`}
              >
                {TASK_TYPE_LABELS[task.taskType] ?? task.taskType}
              </span>
            </TableCell>
            <TableCell>
              <span
                className={`rounded px-1.5 py-0.5 text-xs ${PROFESSIONAL_REQ_COLORS[task.professionalRequirement] ?? ''}`}
              >
                {PROFESSIONAL_REQUIREMENT_LABELS[task.professionalRequirement] ??
                  task.professionalRequirement}
              </span>
            </TableCell>
            <TableCell>
              <Badge variant={PRIORITY_VARIANT[task.priority] ?? 'secondary'} className="text-xs">
                {TASK_PRIORITY_LABELS[task.priority] ?? task.priority}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground text-sm">
              {RECURRENCE_TYPE_LABELS[task.recurrenceType] ?? task.recurrenceType}
            </TableCell>
            <TableCell>
              <div className="flex gap-1">
                <button
                  onClick={() => onEdit(task)}
                  className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 rounded p-1 focus-visible:ring-[3px] focus-visible:outline-none"
                  aria-label="Editar tarea"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => onDelete(task.id)}
                  className="text-muted-foreground hover:text-destructive focus-visible:ring-ring/50 rounded p-1 focus-visible:ring-[3px] focus-visible:outline-none"
                  aria-label="Eliminar tarea"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
