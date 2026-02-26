import { createMaintenancePlanQueries } from '@epde/shared/api';
import { apiClient } from '../api-client';

const queries = createMaintenancePlanQueries(apiClient);
export const { getPlan, getTaskDetail, getTaskLogs, getTaskNotes, completeTask, addTaskNote } =
  queries;
