/**
 * Custom ESLint rule: repositories that do NOT extend `BaseRepository` must
 * carry a JSDoc header documenting which ADR-011 category applies.
 *
 * Why:
 *   ADR-011 defines 3 criteria for extending BaseRepository and 4 valid
 *   categories for NOT extending (cross-model, no-base, append-only,
 *   sub-recurso). The convention was previously code-review-enforced, which
 *   decays: during re-audit we found 3 repos (data-cleanup, weekly-challenge,
 *   isv-snapshot) that had landed without the justification header.
 *
 *   This rule closes the hole — a new `*.repository.ts` that doesn't extend
 *   BaseRepository and lacks the ADR-011 justification fails CI.
 *
 * Trigger:
 *   - File path ends in `.repository.ts` under `apps/api/src/`
 *   - Contains a `ClassDeclaration` named `*Repository` that does NOT extend
 *     an identifier matching BaseRepository
 *   - The class does NOT have a JSDoc block (`/** ... *\/`) immediately
 *     above it mentioning at least one justification keyword
 *
 * Justification keywords (case-insensitive, any one suffices):
 *   - `ADR-011` — explicit reference
 *   - `cross-model` / `cross model` — spans multiple models / raw SQL
 *   - `append-only` / `append only` — time series / audit log
 *   - `sub-recurso` / `sub-resource` — accessed only via parent
 *   - `no-base-model` / `no base model` — utility repo without one anchor entity
 *   - `intentionally` — catch-all for justified exceptions with explanation
 */

const BASE_REPOSITORY_NAMES = new Set(['BaseRepository']);

/** Repository classes that are allowed to skip both extending and the header.
 * Keep this list minimal — every entry is an exception to the exception. */
const ALLOWED_SKIP = new Set([
  // FailedNotificationRepository — internal DLQ plumbing, not a domain model
  'failed-notification.repository.ts',
  // PushTokensRepository — small append-only device registry
  'push-tokens.repository.ts',
]);

const JUSTIFICATION_KEYWORDS = [
  'adr-011',
  'cross-model',
  'cross model',
  'append-only',
  'append only',
  'sub-recurso',
  'sub-resource',
  'no-base-model',
  'no base model',
  'intentionally',
];

function classExtendsBaseRepository(classNode) {
  const superClass = classNode.superClass;
  if (!superClass) return false;
  if (superClass.type === 'Identifier') {
    return BASE_REPOSITORY_NAMES.has(superClass.name);
  }
  if (
    superClass.type === 'TSInstantiationExpression' &&
    superClass.expression?.type === 'Identifier'
  ) {
    return BASE_REPOSITORY_NAMES.has(superClass.expression.name);
  }
  return false;
}

function hasJustification(context, classNode) {
  const sourceCode = context.sourceCode ?? context.getSourceCode();
  // Look at all block comments in the top of the file through the class's
  // leading comments. Either a file-level header or a comment directly
  // above the class counts.
  const classLeading = sourceCode.getCommentsBefore(classNode);
  const fileTop = sourceCode
    .getAllComments()
    .filter((c) => c.type === 'Block' && c.loc.start.line <= 20);
  const candidates = [...fileTop, ...classLeading];
  for (const comment of candidates) {
    if (comment.type !== 'Block') continue;
    const text = comment.value.toLowerCase();
    if (JUSTIFICATION_KEYWORDS.some((kw) => text.includes(kw))) return true;
  }
  return false;
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Repositories in apps/api/src that do not extend BaseRepository must carry a JSDoc header citing an ADR-011 category.',
    },
    messages: {
      missingJustification:
        '`{{className}}` does not extend `BaseRepository`. Per ADR-011, add a JSDoc block above the class explaining which category applies (cross-model / no-base-model / append-only / sub-recurso). Include the word "ADR-011" and the category so future readers and audits find the rationale. If this repo is a documented exception, add its basename to ALLOWED_SKIP in eslint-rules/no-repository-without-justification.mjs.',
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename ?? context.getFilename();
    if (!filename.endsWith('.repository.ts')) return {};

    const basename = filename.split('/').pop();
    if (ALLOWED_SKIP.has(basename)) return {};

    return {
      ClassDeclaration(classNode) {
        // Only check classes named *Repository — ignore helpers/utilities
        // that happen to live in the same file.
        const className = classNode.id?.name;
        if (!className || !className.endsWith('Repository')) return;

        // The BaseRepository class itself is exempt — it's the abstract
        // base, not a concrete implementation.
        if (className === 'BaseRepository') return;

        if (classExtendsBaseRepository(classNode)) return;

        if (hasJustification(context, classNode)) return;

        context.report({
          node: classNode,
          messageId: 'missingJustification',
          data: { className },
        });
      },
    };
  },
};
