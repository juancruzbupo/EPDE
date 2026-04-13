/**
 * Soft-delete nested include helpers.
 *
 * ## Problem
 * The Prisma soft-delete extension (prisma.service.ts) only intercepts MODEL-LEVEL
 * operations (findMany, findFirst, etc.) on the 8 declared soft-deletable models.
 * It does NOT intercept what Prisma resolves inside `include: { relation: true }` —
 * those are resolved as JOINs internally, bypassing the extension entirely.
 *
 * ## Solution
 * For each nested relation that can return soft-deleted records, add
 * `where: { deletedAt: null }` explicitly at the include level.
 *
 * This file provides typed constants for the most common nested filters so
 * repositories don't repeat the same where clause inline.
 *
 * ## Models with deletedAt (soft-deletable)
 * Covered by extension (root level): user, property, task, category,
 *   budgetRequest, serviceRequest, inspectionChecklist, inspectionItem
 * Has deletedAt but NOT in extension (manual where required for nested includes):
 *   maintenancePlan (lifecycle via PlanStatus, not soft-delete),
 *   taskNote, budgetComment, budgetAttachment, taskAuditLog
 *
 * ## Rule
 * Any `include: { <model>: true }` where the model has a `deletedAt` field
 * MUST add `where: { deletedAt: null }` unless intentionally loading deleted records.
 * See SIEMPRE #93 in ai-development-guide.md.
 */

/** Use inside any include that loads tasks from a plan or property. */
export const TASKS_INCLUDE_WHERE = { where: { deletedAt: null } } as const;

/** Use inside findWithDetails or similar when loading notes for a task. */
export const TASK_NOTES_INCLUDE_WHERE = { where: { deletedAt: null } } as const;
