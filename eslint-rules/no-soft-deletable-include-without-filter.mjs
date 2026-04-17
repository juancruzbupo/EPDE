/**
 * Custom ESLint rule: flag Prisma `include` clauses on soft-deletable
 * relations that don't set a `deletedAt: null` filter (or spread
 * `ACTIVE_FILTER`).
 *
 * Background: the Prisma soft-delete extension (`prisma.service.ts`) only
 * intercepts root-level operations on the 8 soft-deletable models. Nested
 * `include: { tasks: true }` bypasses the extension entirely and returns
 * soft-deleted rows. The `ACTIVE_FILTER` constant in
 * `apps/api/src/prisma/soft-delete-include.ts` exists to spread into
 * these includes, but its adoption depends on developer discipline — this
 * rule enforces the pattern.
 *
 * Keep the relation list in sync with the Prisma schema. Currently 8
 * soft-deletable models with the following plausible relation names on
 * other models:
 *   - User  ←  user / users / inspector / requester
 *   - Property  ←  property / properties
 *   - Task  ←  task / tasks
 *   - Category  ←  category / categories
 *   - BudgetRequest  ←  budgetRequest / budgetRequests
 *   - ServiceRequest  ←  serviceRequest / serviceRequests
 *   - InspectionChecklist  ←  inspectionChecklist / inspectionChecklists
 *   - InspectionItem  ←  inspectionItem / inspectionItems / items
 *
 * Escapes recognised:
 *   - `...ACTIVE_FILTER` spread in the relation config.
 *   - `where: { ..., deletedAt: <anything> }` in the relation config.
 *   - `_count` inner `select` objects (these use `where` per sub-relation;
 *     handled recursively).
 *   - Non-literal value (variable, ternary) → skip conservatively.
 */

const SOFT_DELETABLE_RELATIONS = new Set([
  // User relations
  'user',
  'users',
  'inspector',
  'requester',
  // Property
  'property',
  'properties',
  // Task
  'task',
  'tasks',
  // Category
  'category',
  'categories',
  // BudgetRequest
  'budgetRequest',
  'budgetRequests',
  // ServiceRequest
  'serviceRequest',
  'serviceRequests',
  // InspectionChecklist
  'inspectionChecklist',
  'inspectionChecklists',
  // InspectionItem
  'inspectionItem',
  'inspectionItems',
  'items',
]);

/**
 * Singular (belongsTo / hasOne) relations where Prisma does NOT support
 * `where` in the include clause. Flagging these is a false positive because
 * the only way to filter is post-query. The parent record is already
 * filtered by the extension, so a soft-deleted parent with a non-deleted
 * child won't appear anyway.
 *
 * Keep in sync with the Prisma schema @relation annotations.
 */
const SINGULAR_RELATIONS = new Set([
  'user', 'inspector', 'requester',
  'property',
  'task',
  'category',
  'budgetRequest',
  'serviceRequest',
  'inspectionChecklist',
  'inspectionItem',
]);

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Require explicit `deletedAt: null` filter (or `...ACTIVE_FILTER` spread) on Prisma `include` clauses that target soft-deletable relations.',
    },
    messages: {
      literalTrue:
        'Prisma `include` on soft-deletable relation "{{relation}}" must not be `true` — soft-deleted records will leak. Use `{{relation}}: ACTIVE_FILTER` or `{{relation}}: {{openBrace}} ...ACTIVE_FILTER, orderBy: ... {{closeBrace}}`. See SIEMPRE #93.',
      missingFilter:
        'Prisma `include` config for soft-deletable relation "{{relation}}" lacks a `deletedAt` filter. Spread `...ACTIVE_FILTER` or add `where: {{openBrace}} deletedAt: null {{closeBrace}}` explicitly. See SIEMPRE #93.',
    },
    schema: [],
  },
  create(context) {
    /** True if the object has an explicit `deletedAt` inside its `where`. */
    function whereHasDeletedAt(whereNode) {
      if (!whereNode || whereNode.type !== 'ObjectExpression') return true;
      for (const prop of whereNode.properties) {
        if (prop.type === 'SpreadElement') return true;
        if (prop.type !== 'Property') continue;
        const name =
          prop.key.type === 'Identifier'
            ? prop.key.name
            : prop.key.type === 'Literal'
              ? prop.key.value
              : null;
        if (name === 'deletedAt') return true;
      }
      return false;
    }

    /** True if the relation config spreads ACTIVE_FILTER or has where.deletedAt. */
    function relationConfigHasFilter(configNode) {
      if (!configNode || configNode.type !== 'ObjectExpression') {
        // Non-literal config (variable, conditional): skip conservatively.
        return true;
      }
      let whereNode = null;
      for (const prop of configNode.properties) {
        if (prop.type === 'SpreadElement') {
          // Accept any spread — most commonly ACTIVE_FILTER, but a dev using
          // a custom helper object is also covered.
          return true;
        }
        if (prop.type !== 'Property') continue;
        const name =
          prop.key.type === 'Identifier'
            ? prop.key.name
            : prop.key.type === 'Literal'
              ? prop.key.value
              : null;
        if (name === 'where') {
          whereNode = prop.value;
        }
      }
      return whereNode !== null && whereHasDeletedAt(whereNode);
    }

    /** Walks an `include` object and flags each soft-deletable relation
     *  entry that doesn't filter deletedAt. */
    function inspectIncludeObject(includeNode) {
      if (!includeNode || includeNode.type !== 'ObjectExpression') return;
      for (const prop of includeNode.properties) {
        if (prop.type !== 'Property') continue;
        const name =
          prop.key.type === 'Identifier'
            ? prop.key.name
            : prop.key.type === 'Literal'
              ? prop.key.value
              : null;
        if (!name || !SOFT_DELETABLE_RELATIONS.has(name)) continue;
        // Skip singular (belongsTo) relations — Prisma doesn't support
        // `where` in includes for these. The parent is already filtered
        // by the extension, so a soft-deleted related record only appears
        // if the parent itself is visible.
        if (SINGULAR_RELATIONS.has(name)) continue;

        const value = prop.value;
        if (value.type === 'Literal' && value.value === true) {
          context.report({
            node: value,
            messageId: 'literalTrue',
            data: { relation: name, openBrace: '{', closeBrace: '}' },
          });
          continue;
        }
        if (value.type === 'ObjectExpression' && !relationConfigHasFilter(value)) {
          context.report({
            node: value,
            messageId: 'missingFilter',
            data: { relation: name, openBrace: '{', closeBrace: '}' },
          });
        }
      }
    }

    return {
      // Match any object-literal `include: ...` entry and walk it.
      Property(node) {
        if (node.key.type !== 'Identifier' || node.key.name !== 'include') return;
        if (node.value.type !== 'ObjectExpression') return;
        inspectIncludeObject(node.value);
      },
    };
  },
};
