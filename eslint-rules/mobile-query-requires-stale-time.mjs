/**
 * Custom ESLint rule: require an explicit `staleTime` (preferably a
 * `STALE_TIME.X` tier constant) on every `useQuery` / `useInfiniteQuery`
 * call in mobile hooks.
 *
 * Background: `apps/mobile/src/hooks/query-stale-times.ts` exports the
 * canonical tiers (VOLATILE 30s, MEDIUM 1m, SLOW 5m). The global default is
 * 2min — invisible to grep, easy to inherit by accident. Making the tier
 * explicit per hook keeps cache tuning searchable and prevents silent
 * regressions when a new hook is added for a volatile resource.
 *
 * Exceptions: `refetchInterval` alone is fine for polled queries but the
 * rule still wants a `staleTime` (they compose differently). A caller who
 * has a legitimate reason to skip can `eslint-disable-next-line` + justify.
 */

const QUERY_HOOKS = new Set(['useQuery', 'useInfiniteQuery']);

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Require explicit `staleTime` on mobile useQuery/useInfiniteQuery calls. Prefer a STALE_TIME.X tier from @/hooks/query-stale-times.',
    },
    messages: {
      missingStaleTime:
        '`{{hook}}` is missing an explicit `staleTime`. Pick a tier from @/hooks/query-stale-times (STALE_TIME.VOLATILE, MEDIUM, or SLOW) and set it on this query. See SIEMPRE #100.',
    },
    schema: [],
  },
  create(context) {
    function hasStaleTimeKey(objectNode) {
      if (!objectNode || objectNode.type !== 'ObjectExpression') {
        // Non-literal argument (variable, spread): assume covered.
        return true;
      }
      for (const prop of objectNode.properties) {
        if (prop.type === 'SpreadElement') return true;
        if (prop.type !== 'Property') continue;
        if (prop.key.type === 'Identifier' && prop.key.name === 'staleTime') return true;
        if (prop.key.type === 'Literal' && prop.key.value === 'staleTime') return true;
      }
      return false;
    }

    return {
      CallExpression(node) {
        const callee = node.callee;
        if (callee.type !== 'Identifier') return;
        if (!QUERY_HOOKS.has(callee.name)) return;

        const arg = node.arguments[0];
        if (!arg) return;
        if (hasStaleTimeKey(arg)) return;

        context.report({
          node,
          messageId: 'missingStaleTime',
          data: { hook: callee.name },
        });
      },
    };
  },
};
