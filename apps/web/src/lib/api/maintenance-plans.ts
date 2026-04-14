import { createMaintenancePlanQueries, createTaskQueries } from '@epde/shared';

import { apiClient } from '../api-client';

export type {
  PlanListItem,
  PlanPublic,
  TaskDetailPublic,
  TaskListItem,
  TaskLogPublic,
  TaskNotePublic,
  TaskPublic,
} from '@epde/shared';

const planQueries = createMaintenancePlanQueries(apiClient);
const taskQueries = createTaskQueries(apiClient);

export const { getPlans, getPlan, updatePlan } = planQueries;
export const {
  getAllTasks,
  getTaskDetail,
  getTaskLogs,
  getTaskNotes,
  completeTask,
  addTaskNote,
  addTask,
  updateTask,
  bulkAddTasksFromTemplate,
  removeTask,
  reorderTasks,
} = taskQueries;
