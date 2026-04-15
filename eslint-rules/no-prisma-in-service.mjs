/**
 * Custom ESLint rule: services must not inject `PrismaService` directly
 * (i.e. no `this.prisma.<model>.<op>()` calls). Data access goes through
 * a Repository so the soft-delete extension, nested-include filter
 * helpers and pagination contract are applied consistently.
 *
 * SIEMPRE #4 in docs/ai-development-guide.md enunciates the rule. This
 * rule *enforces* it and freezes the allowlist of documented
 * exceptions. Historically AuthAuditService was the only exception —
 * audit writes are plain inserts with no ownership check. Any new
 * exception must be added to ALLOWLIST below with a one-line rationale
 * and referenced from the SIEMPRE rule.
 *
 * Trigger: any `MemberExpression` of shape `this.prisma` anywhere in
 * a .service.ts file NOT in the allowlist. Matching on the filename
 * keeps the rule AST-simple and easy to reason about — an exception
 * is a file path, not a per-method decorator.
 *
 * Test files, helpers, and non-service files are ignored by scope
 * config in eslint.config.mjs, not by the rule itself.
 */

/**
 * Allowlist of files where direct `this.prisma.*` usage is accepted.
 * Each entry MUST include a one-line rationale. When adding a new
 * entry, also document it in SIEMPRE #4 in docs/ai-development-guide.md
 * so the exception is discoverable outside of the lint rule.
 *
 * Paths are matched as suffixes of `context.filename` so they
 * work both in monorepo-root lint runs and in per-app lint runs.
 */
const ALLOWLIST = [
  {
    pathSuffix: 'apps/api/src/auth/auth-audit.service.ts',
    reason:
      'Audit writes are append-only plain inserts with no ownership check and intentionally bypass the repository layer to keep the audit trail independent of domain access control.',
  },
];

function isAllowlisted(filename) {
  return ALLOWLIST.some((entry) => filename.endsWith(entry.pathSuffix));
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Services must access the database through a Repository, not by calling `this.prisma.*` directly. See SIEMPRE #4.',
    },
    messages: {
      directPrisma:
        'Services must not call `this.prisma.*` directly — go through a Repository so soft-delete, nested-include filters and pagination stay consistent. If this file is a legitimate exception (audit, metrics, etc.), add its path to the ALLOWLIST in eslint-rules/no-prisma-in-service.mjs and document it in SIEMPRE #4.',
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename;
    if (isAllowlisted(filename)) return {};

    return {
      MemberExpression(node) {
        // Match `this.prisma` (the left-hand side of any chain like
        // `this.prisma.user.findMany(...)` or `this.prisma.$transaction`).
        if (
          node.object.type === 'ThisExpression' &&
          node.property.type === 'Identifier' &&
          node.property.name === 'prisma'
        ) {
          context.report({ node, messageId: 'directPrisma' });
        }
      },
    };
  },
};
