import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

import * as ts from 'typescript';

/**
 * Drift guardrail: the module dependency graph must be acyclic.
 *
 * NestJS detects cycles at bootstrap time but the error message is generic
 * ("A circular dependency has been detected"), pointing at the forwardRef()
 * site rather than the edge that closed the cycle. With 28+ feature modules,
 * a cycle can be introduced by a single import in a *.module.ts and take
 * hours to diagnose.
 *
 * This test parses every *.module.ts under apps/api/src, extracts the
 * identifiers in its `imports: [...]` array, resolves each to another
 * internal module (skipping @nestjs/* and third-party packages), builds a
 * directed graph, and runs Tarjan's SCC algorithm. Any strongly-connected
 * component of size > 1 is a cycle — test fails with the full cycle path.
 *
 * If you see this test fail, do NOT reach for forwardRef(). Options:
 *   1) Move the shared code to a *DataModule that both sides can import
 *      (see plan-data.module.ts for the pattern).
 *   2) Invert the dependency by making one side emit an event the other
 *      subscribes to.
 *   3) If the cycle is scheduler → domain, fix it at scheduler (domain is
 *      the leaf).
 */

const API_SRC = resolve(__dirname, '..');

function findModuleFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === 'node_modules' || entry === 'dist' || entry === '__mocks__') continue;
      results.push(...findModuleFiles(full));
    } else if (entry.endsWith('.module.ts') && !entry.endsWith('.spec.ts')) {
      results.push(full);
    }
  }
  return results;
}

interface ParsedModule {
  className: string;
  filePath: string;
  importedModuleNames: string[];
}

function parseModule(filePath: string): ParsedModule | null {
  const content = readFileSync(filePath, 'utf-8');
  const sf = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);

  // Map imported identifier → source path (relative module specifier)
  const identifierToSource = new Map<string, string>();
  for (const statement of sf.statements) {
    if (!ts.isImportDeclaration(statement)) continue;
    const specifier = (statement.moduleSpecifier as ts.StringLiteral).text;
    const clause = statement.importClause;
    if (!clause?.namedBindings || !ts.isNamedImports(clause.namedBindings)) continue;
    for (const element of clause.namedBindings.elements) {
      identifierToSource.set(element.name.text, specifier);
    }
  }

  // Find @Module decorator
  let className: string | null = null;
  let importedModuleNames: string[] = [];
  for (const statement of sf.statements) {
    if (!ts.isClassDeclaration(statement)) continue;
    const decorators = ts.getDecorators(statement);
    if (!decorators) continue;
    for (const decorator of decorators) {
      if (!ts.isCallExpression(decorator.expression)) continue;
      const expr = decorator.expression.expression;
      if (!ts.isIdentifier(expr) || expr.text !== 'Module') continue;

      className = statement.name?.text ?? null;
      const arg = decorator.expression.arguments[0];
      if (!arg || !ts.isObjectLiteralExpression(arg)) continue;
      for (const property of arg.properties) {
        if (!ts.isPropertyAssignment(property)) continue;
        const name = property.name;
        if (!ts.isIdentifier(name) || name.text !== 'imports') continue;
        if (!ts.isArrayLiteralExpression(property.initializer)) continue;

        for (const element of property.initializer.elements) {
          const identifier = extractIdentifier(element);
          if (!identifier) continue;
          // Only include if resolved to an internal (relative-path) module
          const source = identifierToSource.get(identifier);
          if (source && source.startsWith('.')) {
            importedModuleNames.push(identifier);
          }
        }
      }
    }
  }

  if (!className) return null;
  return { className, filePath, importedModuleNames };
}

/** Strip `.forRoot()`, `.forFeature([...])`, etc. Returns the root identifier. */
function extractIdentifier(node: ts.Expression): string | null {
  if (ts.isIdentifier(node)) return node.text;
  if (ts.isCallExpression(node)) {
    const callee = node.expression;
    if (ts.isPropertyAccessExpression(callee) && ts.isIdentifier(callee.expression)) {
      return callee.expression.text;
    }
    if (ts.isIdentifier(callee)) return callee.text;
  }
  return null;
}

/** Tarjan's strongly-connected components. Returns SCCs with size > 1 (cycles). */
function findCycles(graph: Map<string, string[]>): string[][] {
  let index = 0;
  const stack: string[] = [];
  const onStack = new Set<string>();
  const indices = new Map<string, number>();
  const lowlinks = new Map<string, number>();
  const cycles: string[][] = [];

  function strongconnect(v: string) {
    indices.set(v, index);
    lowlinks.set(v, index);
    index++;
    stack.push(v);
    onStack.add(v);

    for (const w of graph.get(v) ?? []) {
      if (!indices.has(w)) {
        strongconnect(w);
        lowlinks.set(v, Math.min(lowlinks.get(v)!, lowlinks.get(w)!));
      } else if (onStack.has(w)) {
        lowlinks.set(v, Math.min(lowlinks.get(v)!, indices.get(w)!));
      }
    }

    if (lowlinks.get(v) === indices.get(v)) {
      const scc: string[] = [];
      let w: string;
      do {
        w = stack.pop()!;
        onStack.delete(w);
        scc.push(w);
      } while (w !== v);
      if (scc.length > 1) cycles.push(scc);
    }
  }

  for (const v of graph.keys()) {
    if (!indices.has(v)) strongconnect(v);
  }
  return cycles;
}

describe('Module dependency graph', () => {
  const moduleFiles = findModuleFiles(API_SRC);
  const parsed = moduleFiles
    .map(parseModule)
    .filter((m): m is ParsedModule => m !== null && m.className !== 'AppModule');

  const graph = new Map<string, string[]>();
  for (const mod of parsed) {
    graph.set(mod.className, mod.importedModuleNames);
  }

  it('discovers all *.module.ts files', () => {
    expect(parsed.length).toBeGreaterThan(20);
  });

  it('is acyclic', () => {
    const cycles = findCycles(graph);
    if (cycles.length > 0) {
      console.error(
        'Module import cycles detected:\n' +
          cycles.map((c) => c.concat(c[0]).join(' → ')).join('\n'),
      );
    }
    expect(cycles).toEqual([]);
  });

  it('has no unresolved module references', () => {
    const known = new Set(graph.keys());
    const dangling: { from: string; to: string }[] = [];
    for (const [from, targets] of graph) {
      for (const to of targets) {
        if (!known.has(to)) dangling.push({ from, to });
      }
    }
    if (dangling.length > 0) {
      console.error('Unresolved module refs:', JSON.stringify(dangling, null, 2));
    }
    expect(dangling).toEqual([]);
  });
});

/**
 * Expose a helper for generating docs/module-graph.md. Not a test — lives
 * here so both the test and the doc script work from one parser.
 */
export function buildGraphSummary(): { className: string; imports: string[]; path: string }[] {
  return findModuleFiles(API_SRC)
    .map(parseModule)
    .filter((m): m is ParsedModule => m !== null)
    .map((m) => ({
      className: m.className,
      imports: m.importedModuleNames.sort(),
      path: relative(dirname(API_SRC), m.filePath),
    }))
    .sort((a, b) => a.className.localeCompare(b.className));
}
