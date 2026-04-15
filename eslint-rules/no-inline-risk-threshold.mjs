/**
 * Custom ESLint rule: prefer `getRiskLevel(score)` over inline threshold
 * comparisons like `task.riskScore >= 12` / `score >= 6`.
 *
 * Background: PR-UX-1 centralized risk thresholds in a single helper
 * (`getRiskLevel` from `@epde/shared`) so that the "high / medium / low"
 * boundaries and color classes stay in sync between web and mobile. The
 * helper returns `{ level, colorClass, label }` — callers never need to
 * hard-code `>= 12` or `>= 6` again. This rule catches any new inline
 * threshold so the centralization doesn't silently unravel.
 *
 * Pattern matched: a `BinaryExpression` whose operator is `>=`, whose
 * right-hand side is the literal `12` or `6`, and whose left-hand side
 * is an identifier named `riskScore` or a member access ending in
 * `.riskScore`.
 *
 * Test files are out of scope (scoped via ESLint glob in the config).
 */

const RISK_THRESHOLDS = new Set([6, 12]);

function isRiskScoreNode(node) {
  if (node.type === 'Identifier' && node.name === 'riskScore') return true;
  if (
    node.type === 'MemberExpression' &&
    node.property.type === 'Identifier' &&
    node.property.name === 'riskScore'
  ) {
    return true;
  }
  return false;
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Forbid inline risk-score threshold comparisons (`riskScore >= 12` / `>= 6`). Use `getRiskLevel(score)` from @epde/shared which returns { level, colorClass, label }.',
    },
    messages: {
      inlineThreshold:
        'Inline riskScore threshold (>= {{value}}) — use `getRiskLevel(score)` from @epde/shared instead. The helper centralizes the high/medium/low boundaries and color classes.',
    },
    schema: [],
  },
  create(context) {
    return {
      BinaryExpression(node) {
        if (node.operator !== '>=') return;
        if (node.right.type !== 'Literal') return;
        if (!RISK_THRESHOLDS.has(node.right.value)) return;
        if (!isRiskScoreNode(node.left)) return;

        context.report({
          node,
          messageId: 'inlineThreshold',
          data: { value: String(node.right.value) },
        });
      },
    };
  },
};
