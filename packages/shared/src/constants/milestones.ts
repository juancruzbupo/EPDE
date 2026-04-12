export interface MilestoneDefinition {
  type: string;
  emoji: string;
  label: string;
  description: string;
}

export const MILESTONES: readonly MilestoneDefinition[] = [
  {
    type: 'TASKS_10',
    emoji: '🎉',
    label: 'Primeras 10 tareas',
    description: 'Completaste 10 inspecciones. ¡Tu mantenimiento arrancó!',
  },
  {
    type: 'TASKS_50',
    emoji: '🚀',
    label: '50 tareas completadas',
    description: '50 inspecciones. Sos un experto en prevención.',
  },
  {
    type: 'TASKS_100',
    emoji: '🏆',
    label: '100 tareas completadas',
    description: '100 inspecciones. Tu casa te lo agradece.',
  },
  {
    type: 'FIRST_PREVENTION',
    emoji: '⚡',
    label: 'Primera prevención',
    description: 'Detectaste el primer problema a tiempo. Evitaste reparaciones costosas.',
  },
  {
    type: 'STREAK_6',
    emoji: '🔥',
    label: '6 meses de racha',
    description: 'Medio año sin tareas vencidas. Impresionante.',
  },
  {
    type: 'STREAK_12',
    emoji: '👑',
    label: '1 año de racha',
    description: 'Un año completo al día. Tu patrimonio te lo agradece.',
  },
  {
    type: 'ANNIVERSARY_1',
    emoji: '🎂',
    label: '1 año en EPDE',
    description: 'Un año cuidando tu casa con EPDE.',
  },
] as const;

export type MilestoneType = (typeof MILESTONES)[number]['type'];

export const MILESTONE_MAP = Object.fromEntries(MILESTONES.map((m) => [m.type, m])) as Record<
  MilestoneType,
  MilestoneDefinition
>;
