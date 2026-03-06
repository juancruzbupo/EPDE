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
