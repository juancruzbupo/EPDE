/**
 * Custom ESLint rule: detect hardcoded route strings that should use
 * the central ROUTES constant from `lib/routes.ts`.
 *
 * Detects patterns like:
 *   router.push('/properties/123')
 *   href="/budgets"
 *   window.location.href = '/tasks?status=OVERDUE'
 *
 * Ignores:
 *   - Strings that reference ROUTES.* (already using the constant)
 *   - API paths ('/api/v1/...')
 *   - External URLs ('https://...')
 *   - Anchor links ('#...')
 *   - Import paths
 *   - Test files
 *
 * Scope: apps/web/src and apps/mobile/src (configured in eslint config).
 */

const ROUTE_LIKE_PATTERN = /^\/[a-z]/;
const IGNORED_PREFIXES = ['/api/', '/auth/', '/_next/', '/site.', '/favicon'];

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Route strings should use the ROUTES constant from lib/routes.ts instead of hardcoded paths.',
    },
    messages: {
      hardcodedRoute:
        'Hardcoded route "{{route}}" — use `ROUTES.*` from `@/lib/routes` instead. Centralizing routes prevents typos and makes renames one-line changes.',
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename ?? context.getFilename();
    if (filename.includes('__tests__') || filename.includes('.test.') || filename.includes('.spec.')) return {};
    if (filename.includes('lib/routes')) return {};

    return {
      Literal(node) {
        if (typeof node.value !== 'string') return;
        const val = node.value;
        if (!ROUTE_LIKE_PATTERN.test(val)) return;
        if (IGNORED_PREFIXES.some((p) => val.startsWith(p))) return;

        const parent = node.parent;
        if (!parent) return;

        if (parent.type === 'ImportDeclaration' || parent.type === 'ImportExpression') return;
        if (parent.type === 'CallExpression' && parent.callee?.name === 'require') return;

        context.report({ node, messageId: 'hardcodedRoute', data: { route: val } });
      },

      TemplateLiteral(node) {
        if (node.quasis.length === 0) return;
        const firstPart = node.quasis[0].value.raw;
        if (!ROUTE_LIKE_PATTERN.test(firstPart)) return;
        if (IGNORED_PREFIXES.some((p) => firstPart.startsWith(p))) return;

        const parent = node.parent;
        if (!parent) return;
        if (parent.type === 'ImportDeclaration' || parent.type === 'ImportExpression') return;

        context.report({
          node,
          messageId: 'hardcodedRoute',
          data: { route: firstPart + '...' },
        });
      },
    };
  },
};
