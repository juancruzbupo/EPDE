/**
 * Custom ESLint rule: files in `apps/{web,mobile}/src/lib/api/<basename>.ts`
 * cannot export ad-hoc read functions (`getX`, `listX`, `fetchX`). Reads
 * must come from a `createXxxQueries(apiClient)` factory destructure.
 *
 * Why this exists:
 *   ADR-020 formalizes that reads are the highest-drift surface between
 *   web and mobile (routes, params, cache keys). The sibling rule
 *   `api-factory-must-exist.mjs` validates a factory *exists*; this rule
 *   validates that **reads actually use it**. Together they close the loop.
 *
 *   Writes (POST/PATCH/DELETE) are intentionally exempt: mutation payloads
 *   vary enough across platforms (FormData vs JSON, file URIs, etc.) that
 *   forcing them through factories produces lossy abstractions. Only reads
 *   are mandated.
 *
 * Trigger:
 *   - File path matches `apps/(web|mobile)/src/lib/api/*.ts`
 *   - File basename NOT in EXCEPTION_BASENAMES (shared with api-factory-must-exist)
 *   - File exports a function whose name starts with `get|list|fetch`
 *     via `export async function getX(...)` (direct declaration)
 *
 * The rule is lenient with `export const { getX } = factory` destructuring
 * and with re-exports — those are the intended way to expose factory reads.
 */

const EXCEPTION_BASENAMES = new Set([
  // web-only flows
  'inspections',
  'landing-settings',
  'landing-settings-public',
  // transport-specific
  'upload',
  // auth base flow uses factory for post-login features only; login/logout/refresh
  // are transport-specific (cookies vs SecureStore) and intentionally ad-hoc
  'auth-features',
]);

const PATH_PATTERN = /apps\/(web|mobile)\/src\/lib\/api\//;
const READ_PREFIX = /^(get|list|fetch)[A-Z]/;

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Reads (getX/listX/fetchX) in apps/*/src/lib/api/ must come from a shared factory destructure, not ad-hoc function declarations.',
    },
    messages: {
      adHocRead:
        "`{{name}}` is a read (GET endpoint) declared directly in `{{basename}}.ts`. Reads must come from a shared `createXxxQueries(apiClient)` factory destructure (see ADR-020). If this is intentionally web-only or transport-specific, add `{{basename}}` to EXCEPTION_BASENAMES in eslint-rules/no-ad-hoc-api-read.mjs with justification.",
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename ?? context.getFilename();
    if (!PATH_PATTERN.test(filename)) return {};

    const match = filename.match(/\/lib\/api\/([^/]+)\.ts$/);
    if (!match) return {};
    const basename = match[1];
    if (EXCEPTION_BASENAMES.has(basename)) return {};

    return {
      ExportNamedDeclaration(node) {
        if (!node.declaration) return;
        // Only check `export async function getX(...)` — skip const/type/class exports.
        if (node.declaration.type !== 'FunctionDeclaration') return;
        const name = node.declaration.id?.name;
        if (!name || !READ_PREFIX.test(name)) return;

        context.report({
          node: node.declaration,
          messageId: 'adHocRead',
          data: { name, basename },
        });
      },
    };
  },
};
