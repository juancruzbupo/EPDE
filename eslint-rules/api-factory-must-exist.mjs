/**
 * Custom ESLint rule: every `apps/{web,mobile}/src/lib/api/<basename>.ts` file must consume a
 * shared `createXxxQueries(apiClient)` factory unless it's documented as
 * an exception.
 *
 * Why this exists:
 *   The factory pattern (`packages/shared/src/api/<domain>.ts` exports
 *   `createXxxQueries`, both apps wrap it with their own apiClient) is the
 *   load-bearing convention that prevents web + mobile API surfaces from
 *   drifting. Without enforcement, a new contributor adding an api file
 *   directly with axios calls — bypassing the shared factory — is the
 *   first step toward parallel implementations that diverge under load.
 *
 *   This rule freezes the convention: a new file in `lib/api/` either uses
 *   a shared factory OR it must justify the exception by adding its
 *   basename to EXCEPTION_BASENAMES below + documenting the rationale in
 *   `packages/shared/src/api/index.ts` header.
 *
 * Trigger:
 *   - File path matches `apps/(web|mobile)/src/lib/api/*.ts`
 *   - File source does NOT contain a call like `createXxxQueries(apiClient)`
 *   - File basename (without `.ts`) NOT in EXCEPTION_BASENAMES
 *
 * The pattern check is intentionally textual (regex on source text) rather
 * than AST-based because the convention is "any factory call from
 * @epde/shared", not a specific named import.
 */

/**
 * Files documented as legitimate exceptions to the factory pattern. Each
 * entry must be cross-referenced from the header of
 * `packages/shared/src/api/index.ts` with a one-line rationale.
 *
 * Adding to this list is not free: it weakens the convention. Prefer
 * extracting a shared factory unless one of the documented reasons applies
 * (web-only, transport-specific, or no meaningful cross-platform surface).
 */
const EXCEPTION_BASENAMES = new Set([
  // web-only flows
  'inspections',
  'landing-settings',
  'landing-settings-public',
  // transport-specific
  'upload',
]);

const FACTORY_CALL_PATTERN = /create\w+Queries\s*\(\s*apiClient\s*\)/;
const PATH_PATTERN = /apps\/(web|mobile)\/src\/lib\/api\//;

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Files in apps/*/src/lib/api/ must consume a shared createXxxQueries() factory or be documented as an exception.',
    },
    messages: {
      missingFactory:
        '`{{basename}}.ts` must consume a `createXxxQueries(apiClient)` factory from @epde/shared, or be added to EXCEPTION_BASENAMES in eslint-rules/api-factory-must-exist.mjs (and documented in packages/shared/src/api/index.ts header). The factory pattern is what keeps web + mobile API surfaces in sync.',
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename ?? context.getFilename();
    if (!PATH_PATTERN.test(filename)) return {};

    // Match e.g. `.../api/budgets.ts` -> `budgets`
    const match = filename.match(/\/lib\/api\/([^/]+)\.ts$/);
    if (!match) return {};
    const basename = match[1];

    if (EXCEPTION_BASENAMES.has(basename)) return {};

    return {
      Program(node) {
        const sourceCode = context.sourceCode ?? context.getSourceCode();
        const source = sourceCode.getText();
        if (FACTORY_CALL_PATTERN.test(source)) return;

        context.report({ node, messageId: 'missingFactory', data: { basename } });
      },
    };
  },
};
