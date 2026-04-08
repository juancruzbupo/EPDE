import type { PropertySector, TaskPriority } from '../types/enums';

/**
 * Composite Risk Score v1 — ranks tasks by urgency for the client.
 *
 * Formula: priority_weight × severity_weight × sector_weight
 *
 * Higher score = fix first. Guides the client on what to address before
 * other items to avoid escalating costs.
 *
 * Weights:
 * - Priority: URGENT=4, HIGH=3, MEDIUM=2, LOW=1
 * - Severity (from inspection): NEEDS_PROFESSIONAL=3, NEEDS_ATTENTION=2, OK=1
 * - Sector: structural sectors (EXTERIOR, ROOF, BASEMENT) = 1.5x because
 *   structural problems escalate faster and cost more if delayed
 */

const PRIORITY_WEIGHT: Record<string, number> = {
  URGENT: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

const SEVERITY_WEIGHT: Record<string, number> = {
  NEEDS_PROFESSIONAL: 3,
  NEEDS_ATTENTION: 2,
  OK: 1,
};

/** Structural sectors where problems escalate faster. */
const STRUCTURAL_SECTORS: Set<string> = new Set(['EXTERIOR', 'ROOF', 'BASEMENT', 'INSTALLATIONS']);

export function computeRiskScore(
  priority: TaskPriority | string,
  inspectionStatus: string,
  sector: PropertySector | string | null,
): number {
  const priorityW = PRIORITY_WEIGHT[priority] ?? 2;
  const severityW = SEVERITY_WEIGHT[inspectionStatus] ?? 1;
  const sectorW = sector && STRUCTURAL_SECTORS.has(sector) ? 1.5 : 1.0;

  return Math.round(priorityW * severityW * sectorW);
}
