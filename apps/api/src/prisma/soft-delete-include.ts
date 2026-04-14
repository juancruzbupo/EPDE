/**
 * Soft-delete nested include helpers.
 *
 * ## Problem
 * The Prisma soft-delete extension (prisma.service.ts) only intercepts MODEL-LEVEL
 * operations (findMany, findFirst, etc.) on the 9 declared soft-deletable models.
 * It does NOT intercept what Prisma resolves inside `include: { relation: true }` —
 * those are resolved as JOINs internally, bypassing the extension entirely.
 *
 * ## Solution
 * For each nested relation that can return soft-deleted records, add
 * `where: { deletedAt: null }` explicitly at the include level. The constants
 * below spread into include objects so callers don't duplicate the where
 * clause inline (and so a future change to the soft-delete convention has one
 * edit site).
 *
 * ## Usage
 * ```ts
 * // Plain:
 * include: { tasks: ACTIVE_FILTER }
 *
 * // With extras:
 * include: { tasks: { ...ACTIVE_FILTER, orderBy: { order: 'asc' } } }
 *
 * // Nested:
 * include: {
 *   tasks: { ...ACTIVE_FILTER, include: { taskLogs: ACTIVE_FILTER } },
 * }
 * ```
 *
 * ## Models with deletedAt (soft-deletable)
 * Covered by extension (root level): user, property, task, category,
 *   budgetRequest, serviceRequest, inspectionChecklist, inspectionItem,
 *   maintenancePlan.
 * Has deletedAt but NOT in extension (manual where required everywhere —
 * root AND nested):
 *   taskNote, taskLog, taskAuditLog, budgetComment, budgetAttachment.
 *
 * ## Rule
 * Any `include: { <model>: true }` where the model has a `deletedAt` field
 * MUST use `ACTIVE_FILTER` (or an inline `where: { deletedAt: null }`) unless
 * intentionally loading deleted records. See SIEMPRE #93 in
 * ai-development-guide.md.
 */

/**
 * Generic active-record filter. Use as a spread in include objects:
 *   `include: { tasks: { ...ACTIVE_FILTER, orderBy: { order: 'asc' } } }`
 *
 * Works for any nested relation whose Prisma model has a `deletedAt`
 * column. Soft-deletable relation names in this codebase include:
 *   tasks, items, taskLogs, taskNotes, taskAuditLog, budgetComments,
 *   budgetAttachments, serviceRequests, budgetRequests, properties,
 *   maintenancePlan (singular, 1:1).
 */
export const ACTIVE_FILTER = { where: { deletedAt: null } } as const;
