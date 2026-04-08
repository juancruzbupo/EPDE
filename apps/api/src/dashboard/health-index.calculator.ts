import {
  CONDITION_SCORE_PERCENT,
  type ConditionFound,
  PREVENTIVE_ACTIONS,
  TaskStatus,
} from '@epde/shared';

// ─── Input types ────────────────────────────────────────

interface TaskData {
  status: string;
  priority: string;
  sector: string | null;
}

interface LogData {
  conditionFound: string;
  actionTaken: string;
  completedAt?: Date;
  taskSector?: string | null;
}

// ─── Output types ───────────────────────────────────────

export interface HealthIndexResult {
  score: number;
  label: string;
  dimensions: {
    compliance: number;
    condition: number;
    coverage: number;
    investment: number;
    trend: number;
  };
  sectorScores: { sector: string; score: number; overdue: number; total: number }[];
}

// ─── Constants ──────────────────────────────────────────

const PRIORITY_WEIGHT: Record<string, number> = {
  URGENT: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

const LABELS: [number, string][] = [
  [80, 'Excelente'],
  [60, 'Bueno'],
  [40, 'Regular'],
  [20, 'Necesita atención'],
  [0, 'Crítico'],
];

const EMPTY_RESULT: HealthIndexResult = {
  score: 0,
  label: 'Sin datos',
  dimensions: { compliance: 0, condition: 0, coverage: 0, investment: 0, trend: 0 },
  sectorScores: [],
};

// ─── Pure computation ───────────────────────────────────

/**
 * Computes the ISV (Housing Health Index) from raw data.
 * Pure function — no Prisma dependency, no side effects.
 *
 * @param tasks - Active tasks in the plan
 * @param recentLogs - Task logs from last 12 months
 * @param olderLogs - Task logs from 3-6 months ago (for trend). Optional.
 * @param threeMonthsAgo - Cutoff date for "recent" in trend calc. Optional.
 */
export function computeHealthIndex(
  tasks: TaskData[],
  recentLogs: LogData[],
  olderLogs?: LogData[],
  threeMonthsAgo?: Date,
): HealthIndexResult {
  if (tasks.length === 0) return EMPTY_RESULT;

  // ─── 1. COMPLIANCE (35%) — weighted by priority ───
  let totalWeight = 0;
  let onTimeWeight = 0;
  for (const t of tasks) {
    const w = PRIORITY_WEIGHT[t.priority] ?? 2;
    totalWeight += w;
    if (t.status !== TaskStatus.OVERDUE) onTimeWeight += w;
  }
  const compliance = totalWeight > 0 ? Math.round((onTimeWeight / totalWeight) * 100) : 100;

  // ─── 2. CONDITION (30%) — avg conditionFound ───
  const conditionScores = recentLogs
    .map((l) => CONDITION_SCORE_PERCENT[l.conditionFound as ConditionFound] ?? 60)
    .filter((v) => v != null);
  const condition =
    conditionScores.length > 0
      ? Math.round(conditionScores.reduce((a, b) => a + b, 0) / conditionScores.length)
      : 50;

  // ─── 3. COVERAGE (20%) — % sectors with inspection ───
  const allSectors = new Set(tasks.map((t) => t.sector).filter(Boolean));
  const inspectedSectors = new Set(recentLogs.map((l) => l.taskSector).filter(Boolean));
  const coverage =
    allSectors.size > 0 ? Math.round((inspectedSectors.size / allSectors.size) * 100) : 0;

  // ─── 4. INVESTMENT (15%) — preventive vs corrective ───
  const preventiveCount = recentLogs.filter((l) =>
    (PREVENTIVE_ACTIONS as readonly string[]).includes(l.actionTaken),
  ).length;
  const investment =
    recentLogs.length > 0 ? Math.round((preventiveCount / recentLogs.length) * 100) : 50;

  // ─── 5. TREND — compare recent vs older condition ───
  let trend = 50; // default = stable
  if (olderLogs && threeMonthsAgo) {
    const recentCondAvg = recentLogs
      .filter((l) => l.completedAt && l.completedAt >= threeMonthsAgo)
      .map((l) => CONDITION_SCORE_PERCENT[l.conditionFound as ConditionFound] ?? 60);
    const olderCondAvg = olderLogs.map(
      (l) => CONDITION_SCORE_PERCENT[l.conditionFound as ConditionFound] ?? 60,
    );

    const avgRecent =
      recentCondAvg.length > 0
        ? recentCondAvg.reduce((a, b) => a + b, 0) / recentCondAvg.length
        : 50;
    const avgOlder =
      olderCondAvg.length > 0 ? olderCondAvg.reduce((a, b) => a + b, 0) / olderCondAvg.length : 50;
    trend = Math.max(0, Math.min(100, Math.round(50 + (avgRecent - avgOlder))));
  }

  // ─── GLOBAL SCORE ───
  const score = Math.round(
    compliance * 0.35 + condition * 0.3 + coverage * 0.2 + investment * 0.15,
  );
  const label = LABELS.find(([threshold]) => score >= threshold)?.[1] ?? 'Crítico';

  // ─── SECTOR SCORES ───
  const sectorMap = new Map<string, { total: number; overdue: number }>();
  for (const t of tasks) {
    if (!t.sector) continue;
    const entry = sectorMap.get(t.sector) ?? { total: 0, overdue: 0 };
    entry.total += 1;
    if (t.status === TaskStatus.OVERDUE) entry.overdue += 1;
    sectorMap.set(t.sector, entry);
  }
  const sectorScores = [...sectorMap.entries()]
    .map(([sector, data]) => ({
      sector,
      score: data.total > 0 ? Math.round(((data.total - data.overdue) / data.total) * 100) : 100,
      overdue: data.overdue,
      total: data.total,
    }))
    .sort((a, b) => a.score - b.score);

  return {
    score,
    label,
    dimensions: { compliance, condition, coverage, investment, trend },
    sectorScores,
  };
}
