import { PlanStatus } from '@epde/shared';
import React from 'react';

import { ConfirmDialog } from '@/components/confirm-dialog';
import type { TaskPublic } from '@/lib/api/maintenance-plans';

import { CreateServiceDialog } from '../../../service-requests/create-service-dialog';
import { BulkCompleteDialog } from '../bulk-complete-dialog';
import { CompleteTaskDialog } from '../complete-task-dialog';
import { TaskDialog } from '../task-dialog';
import { TemplateApplicationDialog } from './template-application-dialog';

interface ServiceDialogInfo {
  propertyId: string;
  taskId: string;
  title: string;
  description: string;
}

interface CategoryTemplate {
  id: string;
  name: string;
  description: string | null;
  tasks: unknown[];
}

interface PlanDialogsProps {
  planId: string;
  propertyId: string;
  activeSectors?: string[];

  /* Task create/edit dialog */
  taskDialogOpen: boolean;
  onTaskDialogChange: (open: boolean) => void;
  editingTask: TaskPublic | null;

  /* Delete task dialog */
  deleteTaskId: string | null;
  onDeleteTaskChange: () => void;
  onDeleteConfirm: () => void;
  isDeleting: boolean;

  /* Status transition dialog */
  statusTransition: PlanStatus | null;
  onStatusTransitionChange: () => void;
  onStatusConfirm: () => void;
  isUpdatingPlan: boolean;

  /* Complete task dialog */
  completingTask: TaskPublic | null;
  onCompletingTaskChange: () => void;
  onProblemDetected: (info: { taskId: string; taskName: string }) => void;

  /* Service request dialog */
  serviceDialogTask: ServiceDialogInfo | null;
  onServiceDialogChange: (open: boolean) => void;

  /* Bulk complete dialog */
  bulkCompleteOpen: boolean;
  onBulkCompleteChange: (open: boolean) => void;
  selectedTasks: TaskPublic[];
  onBulkCompleteDone: () => void;

  /* Template dialog */
  templateDialogOpen: boolean;
  onTemplateDialogChange: (open: boolean) => void;
  categoryTemplates: CategoryTemplate[] | undefined;
  onApplyTemplates: (templateIds: string[]) => void;
  isApplyingTemplate: boolean;
}

export const PlanDialogs = React.memo(function PlanDialogs({
  planId,
  activeSectors,
  taskDialogOpen,
  onTaskDialogChange,
  editingTask,
  deleteTaskId,
  onDeleteTaskChange,
  onDeleteConfirm,
  isDeleting,
  statusTransition,
  onStatusTransitionChange,
  onStatusConfirm,
  isUpdatingPlan,
  completingTask,
  onCompletingTaskChange,
  onProblemDetected,
  serviceDialogTask,
  onServiceDialogChange,
  bulkCompleteOpen,
  onBulkCompleteChange,
  selectedTasks,
  onBulkCompleteDone,
  templateDialogOpen,
  onTemplateDialogChange,
  categoryTemplates,
  onApplyTemplates,
  isApplyingTemplate,
}: PlanDialogsProps) {
  return (
    <>
      <TaskDialog
        open={taskDialogOpen}
        onOpenChange={onTaskDialogChange}
        planId={planId}
        task={editingTask}
        activeSectors={activeSectors}
      />

      <ConfirmDialog
        open={!!deleteTaskId}
        onOpenChange={onDeleteTaskChange}
        title="Eliminar tarea"
        description="¿Estás seguro de que querés eliminar esta tarea?"
        onConfirm={onDeleteConfirm}
        isLoading={isDeleting}
      />

      <ConfirmDialog
        open={!!statusTransition}
        onOpenChange={onStatusTransitionChange}
        title={statusTransition === PlanStatus.ACTIVE ? 'Activar plan' : 'Archivar plan'}
        description={
          statusTransition === PlanStatus.ACTIVE
            ? '¿Estás seguro de que querés activar este plan?'
            : '¿Estás seguro de que querés archivar este plan? Esta acción no se puede deshacer.'
        }
        onConfirm={onStatusConfirm}
        isLoading={isUpdatingPlan}
      />

      <CompleteTaskDialog
        open={!!completingTask}
        onOpenChange={onCompletingTaskChange}
        task={completingTask}
        planId={planId}
        onProblemDetected={onProblemDetected}
      />

      <CreateServiceDialog
        open={!!serviceDialogTask}
        onOpenChange={onServiceDialogChange}
        defaultPropertyId={serviceDialogTask?.propertyId}
        defaultTaskId={serviceDialogTask?.taskId}
        defaultTitle={serviceDialogTask?.title}
        defaultDescription={serviceDialogTask?.description}
      />

      <BulkCompleteDialog
        open={bulkCompleteOpen}
        onOpenChange={onBulkCompleteChange}
        tasks={selectedTasks}
        planId={planId}
        onDone={onBulkCompleteDone}
      />

      <TemplateApplicationDialog
        open={templateDialogOpen}
        onOpenChange={onTemplateDialogChange}
        categoryTemplates={categoryTemplates}
        onApply={onApplyTemplates}
        isApplying={isApplyingTemplate}
      />
    </>
  );
});
