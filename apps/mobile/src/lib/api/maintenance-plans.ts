import { createMaintenancePlanQueries, createTaskQueries } from '@epde/shared';

import { apiClient } from '../api-client';

export type { PlanListItem, TaskListItem } from '@epde/shared';

const planQueries = createMaintenancePlanQueries(apiClient);
const taskQueries = createTaskQueries(apiClient);

export const { getPlans, getPlan, updatePlan } = planQueries;
export const { getAllTasks, getTaskDetail, getTaskLogs, getTaskNotes, completeTask, addTaskNote } =
  taskQueries;
