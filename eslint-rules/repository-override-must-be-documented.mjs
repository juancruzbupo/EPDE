/**
 * Custom ESLint rule: methods overriding BaseRepository in a *.repository.ts
 * file must carry a JSDoc block explaining the rationale.
 *
 * Why:
 *   BaseRepository provides a stable contract for CRUD + pagination + soft-delete
 *   semantics (see ADR-011). If a concrete repository overrides one of those
 *   base methods, it is almost always changing behavior in a way that matters
 *   to callers — e.g. InspectionChecklistRepository.softDelete cascades to
 *   items + detaches the plan back-reference. Dropping that rationale makes
 *   the override invisible in code review and future maintenance.
 *
 *   `tsconfig.noImplicitOverride: true` already forces the `override` keyword.
 *   This rule adds the second guardrail: whenever you write `override`, you
 *   must also explain why.
 *
 * Trigger:
 *   - File ends in `.repository.ts`
 *   - Class extends a base identifier matching BaseRepository (name-based, not type)
 *   - Method has the `override` keyword
 *   - No JSDoc block (/** ... *\/) directly above the method
 */

const BASE_REPOSITORY_NAMES = new Set(['BaseRepository']);

function classExtendsBaseRepository(classNode) {
  const superClass = classNode.superClass;
  if (!superClass) return false;
  // Handle both `extends BaseRepository` and `extends BaseRepository<T, 'model'>`
  if (superClass.type === 'Identifier') {
    return BASE_REPOSITORY_NAMES.has(superClass.name);
  }
  // TSInstantiationExpression (generic instantiation, ESLint parsers vary)
  if (superClass.type === 'TSInstantiationExpression' && superClass.expression?.type === 'Identifier') {
    return BASE_REPOSITORY_NAMES.has(superClass.expression.name);
  }
  return false;
}

function hasJSDoc(context, node) {
  const sourceCode = context.sourceCode ?? context.getSourceCode();
  const comments = sourceCode.getCommentsBefore(node);
  return comments.some((c) => c.type === 'Block' && c.value.startsWith('*'));
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Overrides of BaseRepository methods in *.repository.ts files must carry a JSDoc block explaining the rationale.',
    },
    messages: {
      missingJSDoc:
        'Override of BaseRepository.{{name}} must have a JSDoc block (/** ... */) immediately above it explaining why the base behavior is insufficient. See ADR-011.',
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename ?? context.getFilename();
    if (!filename.endsWith('.repository.ts')) return {};

    return {
      ClassDeclaration(classNode) {
        if (!classExtendsBaseRepository(classNode)) return;

        for (const member of classNode.body.body) {
          if (member.type !== 'MethodDefinition') continue;
          if (!member.override) continue;
          if (hasJSDoc(context, member)) continue;

          const name = member.key.type === 'Identifier' ? member.key.name : '<anonymous>';
          context.report({
            node: member,
            messageId: 'missingJSDoc',
            data: { name },
          });
        }
      },
    };
  },
};
