import { createMaintenancePlanQueries } from '@epde/shared';

import { apiClient } from '../api-client';

export type { PlanListItem, TaskListItem } from '@epde/shared';

// Mobile is client-only — only query factories and client mutations (completeTask, addTaskNote)
// are exported. Admin operations (updatePlan, addTask, updateTask, removeTask, reorderTasks)
// are intentionally excluded. See web's maintenance-plans.ts for admin functions.
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
