/**
 * Mobile maintenance-plan API — client-only.
 * Only query factories and client mutations (completeTask, addTaskNote) are exported.
 * Admin operations (updatePlan, addTask, updateTask, removeTask, reorderTasks)
 * live exclusively in web's maintenance-plans.ts.
 */
import { createMaintenancePlanQueries } from '@epde/shared';

import { apiClient } from '../api-client';

export type { PlanListItem, TaskListItem } from '@epde/shared';
const queries = createMaintenancePlanQueries(apiClient);
export const {
  getPlans,
  getAllTasks,
  getPlan,
  getTaskDetail,
  getTaskLogs,
  getTaskNotes,
  completeTask,
  addTaskNote,
} = queries;
