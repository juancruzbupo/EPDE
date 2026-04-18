/**
 * Custom ESLint rule: flag reads/updates on soft-deletable Prisma models
 * inside $transaction callbacks that don't include `deletedAt: null` in their
 * `where` clause (or aren't setting `deletedAt` themselves as a cascading
 * soft-delete).
 *
 * Background: the Prisma soft-delete extension installed in PrismaService
 * doesn't apply inside `$transaction` blocks — the `tx` client is the raw
 * Prisma client. Without an explicit filter, callers silently read or update
 * soft-deleted rows. See apps/api/src/prisma/prisma.service.ts for the
 * underlying limitation and ai-development-guide.md for the SIEMPRE rule.
 *
 * Tracks both forms of the transaction boundary:
 *   - `prisma.$transaction(...)` (raw Prisma client, used inside BaseRepository).
 *   - `<repo>.withTransaction(...)` (the service-facing wrapper defined in
 *     BaseRepository that delegates to `$transaction`). Services don't call
 *     `$transaction` directly (SIEMPRE #4), so tracking only the raw form
 *     would miss every service-initiated transaction after the repository
 *     boundary was enforced.
 *
 * Keep the soft-deletable model list in sync with SOFT_DELETABLE_MODELS in
 * apps/api/src/prisma/prisma.service.ts. The list below is intentionally
 * duplicated rather than imported — this rule runs in the lint phase where
 * TypeScript source is unavailable at runtime.
 */

// Must match SOFT_DELETABLE_MODELS in apps/api/src/prisma/prisma.service.ts
// (validated at runtime by the sync test in
// packages/shared/src/__tests__/soft-deletable-models.sync.spec.ts).
// MaintenancePlan is NOT in this list — its schema has no deletedAt column;
// it uses PlanStatus (DRAFT|ACTIVE|ARCHIVED) for lifecycle.
const SOFT_DELETABLE_MODELS = new Set([
  'user',
  'property',
  'task',
  'category',
  'budgetRequest',
  'serviceRequest',
  'inspectionChecklist',
  'inspectionItem',
  'professional',
]);

const READ_OPERATIONS = new Set([
  'findMany',
  'findFirst',
  'findUnique',
  'findUniqueOrThrow',
  'findFirstOrThrow',
]);

const UPDATE_OPERATIONS = new Set(['update', 'updateMany']);

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Require explicit `deletedAt: null` filter (or `deletedAt` in data for cascade deletes) on soft-deletable models inside $transaction callbacks',
    },
    messages: {
      missingFilter:
        'Prisma query on soft-deletable model "{{model}}" inside $transaction is missing `deletedAt: null` in where. The soft-delete extension does NOT apply inside $transaction — add the filter explicitly, or add `deletedAt: now` to data for a cascade soft-delete, or disable this rule with an explanatory comment (e.g. TOCTOU race).',
    },
    schema: [],
  },
  create(context) {
    let txDepth = 0;

    /**
     * Walks an object-expression `where` or `data` property and returns true
     * if it explicitly sets / filters the `deletedAt` key. Skips spreads
     * conservatively (returns true) to avoid false positives where the filter
     * lives in a merged variable.
     */
    function hasDeletedAtKey(objectNode) {
      if (!objectNode || objectNode.type !== 'ObjectExpression') {
        // Non-literal (spread, variable, conditional): assume filter exists.
        return true;
      }
      for (const prop of objectNode.properties) {
        if (prop.type === 'SpreadElement') return true;
        if (prop.type !== 'Property') continue;
        if (prop.key.type === 'Identifier' && prop.key.name === 'deletedAt') return true;
        if (prop.key.type === 'Literal' && prop.key.value === 'deletedAt') return true;
      }
      return false;
    }

    function getObjectProperty(objectNode, keyName) {
      if (!objectNode || objectNode.type !== 'ObjectExpression') return null;
      for (const prop of objectNode.properties) {
        if (prop.type !== 'Property') continue;
        const name =
          prop.key.type === 'Identifier'
            ? prop.key.name
            : prop.key.type === 'Literal'
              ? prop.key.value
              : null;
        if (name === keyName) return prop.value;
      }
      return null;
    }

    /**
     * Returns `{ model, op }` if the CallExpression is shaped like
     * `<base>.<model>.<op>(...)` where `<base>` is any prisma-ish accessor
     * (`tx`, `prisma`, `this.prisma`, etc.); otherwise null. We accept any
     * base because array-form transactions use the outer prisma client
     * (`this.prisma.task.update(...)`) while callback-form uses the `tx`
     * parameter. Both patterns land inside the `$transaction` scope, which
     * is enforced separately via `txDepth > 0`.
     */
    function parseTxPrismaCall(callNode) {
      if (callNode.type !== 'CallExpression') return null;
      const callee = callNode.callee;
      if (callee.type !== 'MemberExpression') return null;
      const opNode = callee.property;
      const modelMember = callee.object;
      if (opNode.type !== 'Identifier') return null;
      if (modelMember.type !== 'MemberExpression') return null;
      const modelNode = modelMember.property;
      if (modelNode.type !== 'Identifier') return null;
      return { model: modelNode.name, op: opNode.name };
    }

    return {
      CallExpression(node) {
        const callee = node.callee;
        if (
          callee.type === 'MemberExpression' &&
          callee.property.type === 'Identifier' &&
          (callee.property.name === '$transaction' || callee.property.name === 'withTransaction')
        ) {
          txDepth++;
          return;
        }

        if (txDepth === 0) return;

        const parsed = parseTxPrismaCall(node);
        if (!parsed) return;

        const { model, op } = parsed;
        if (!SOFT_DELETABLE_MODELS.has(model)) return;

        const isRead = READ_OPERATIONS.has(op);
        const isUpdate = UPDATE_OPERATIONS.has(op);
        if (!isRead && !isUpdate) return;

        const arg = node.arguments[0];
        if (!arg || arg.type !== 'ObjectExpression') {
          // Non-literal argument — skip conservatively.
          return;
        }

        const whereNode = getObjectProperty(arg, 'where');
        const dataNode = getObjectProperty(arg, 'data');

        // Cascade soft-delete: setting deletedAt in data is the write's purpose.
        if (dataNode && hasDeletedAtKey(dataNode)) return;

        // Explicit filter.
        if (whereNode && hasDeletedAtKey(whereNode)) return;

        context.report({
          node,
          messageId: 'missingFilter',
          data: { model },
        });
      },
      'CallExpression:exit'(node) {
        const callee = node.callee;
        if (
          callee.type === 'MemberExpression' &&
          callee.property.type === 'Identifier' &&
          (callee.property.name === '$transaction' || callee.property.name === 'withTransaction')
        ) {
          txDepth--;
        }
      },
    };
  },
};
