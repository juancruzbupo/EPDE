import {
  ProfessionalRequirement,
  RecurrenceType,
  TaskPriority,
  TaskStatus,
  TaskType,
} from '@epde/shared';

/** Default task field values for test fixtures — avoids string literal drift */
export const TEST_TASK_DEFAULTS = {
  priority: TaskPriority.MEDIUM,
  recurrenceType: RecurrenceType.ANNUAL,
  recurrenceMonths: 12,
  status: TaskStatus.PENDING,
  taskType: TaskType.INSPECTION,
  professionalRequirement: ProfessionalRequirement.OWNER_CAN_DO,
} as const;
