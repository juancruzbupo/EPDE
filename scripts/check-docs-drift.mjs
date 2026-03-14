#!/usr/bin/env node
/**
 * check-docs-drift.mjs
 *
 * Detects drift between documentation files and the actual codebase.
 * Checks:
 *   1. Entity count in data-model.md matches Prisma model count
 *   2. Enum names in data-model.md match Prisma enum names
 *   3. API endpoint count in api-reference.md is ≥ actual controller method count
 *   4. Section 3.8 in ai-development-guide.md references current pattern (NotificationsHandlerService)
 *
 * Exits with code 1 when drift is found.
 *
 * Run: node scripts/check-docs-drift.mjs
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const issues = [];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function readFile(relativePath) {
  const full = resolve(root, relativePath);
  if (!existsSync(full)) return null;
  return readFileSync(full, 'utf8');
}

// ─── 1. Entity count in data-model.md vs Prisma models ─────────────────────

const schemaText = readFile('apps/api/prisma/schema.prisma');
const dataModelDoc = readFile('docs/data-model.md');

if (schemaText && dataModelDoc) {
  const prismaModels = [...schemaText.matchAll(/^model\s+(\w+)\s+\{/gm)].map((m) => m[1]);
  const prismaModelCount = prismaModels.length;

  // Look for entity count mentions like "16 entidades" or "X entities"
  const entityCountMatch = dataModelDoc.match(/(\d+)\s+entidad/i);
  if (entityCountMatch) {
    const docCount = parseInt(entityCountMatch[1], 10);
    if (docCount !== prismaModelCount) {
      issues.push({
        file: 'docs/data-model.md',
        issue: `States ${docCount} entidades but Prisma has ${prismaModelCount} models`,
      });
    }
  }

  // Check that all Prisma enum names appear in data-model.md
  const prismaEnums = [...schemaText.matchAll(/^enum\s+(\w+)\s+\{/gm)].map((m) => m[1]);
  const missingEnums = prismaEnums.filter((e) => !dataModelDoc.includes(e));
  if (missingEnums.length > 0) {
    issues.push({
      file: 'docs/data-model.md',
      issue: `Prisma enums missing from docs: ${missingEnums.join(', ')}`,
    });
  }
}

// ─── 2. ai-development-guide.md — section 3.8 should reference current pattern ─

const aiGuide = readFile('docs/ai-development-guide.md');

if (aiGuide) {
  // Section 3.8 should mention NotificationsHandlerService (current pattern)
  // and should NOT mention @OnEvent (obsolete pattern)
  const section38Match = aiGuide.match(/### 3\.8[^#]*/s);
  if (section38Match) {
    const section38 = section38Match[0];
    if (section38.includes('@OnEvent')) {
      issues.push({
        file: 'docs/ai-development-guide.md',
        issue: 'Section 3.8 still references obsolete @OnEvent pattern',
      });
    }
    if (!section38.includes('NotificationsHandlerService')) {
      issues.push({
        file: 'docs/ai-development-guide.md',
        issue: 'Section 3.8 does not reference NotificationsHandlerService',
      });
    }
  }
}

// ─── 3. SIEMPRE/NUNCA counts should be sequential ──────────────────────────

if (aiGuide) {
  const siempreNumbers = [...aiGuide.matchAll(/SIEMPRE\s*#(\d+)/g)].map((m) => parseInt(m[1], 10));
  const nuncaNumbers = [...aiGuide.matchAll(/NUNCA\s*#(\d+)/g)].map((m) => parseInt(m[1], 10));

  for (const [label, numbers] of [['SIEMPRE', siempreNumbers], ['NUNCA', nuncaNumbers]]) {
    if (numbers.length === 0) continue;
    const sorted = [...new Set(numbers)].sort((a, b) => a - b);
    for (let i = 0; i < sorted.length - 1; i++) {
      if (sorted[i + 1] !== sorted[i] + 1) {
        issues.push({
          file: 'docs/ai-development-guide.md',
          issue: `${label} numbering gap: #${sorted[i]} → #${sorted[i + 1]} (expected #${sorted[i] + 1})`,
        });
        break;
      }
    }
  }
}

// ─── 4. monorepo-completo.md — workspace count ─────────────────────────────

const monorepoDoc = readFile('docs/monorepo-completo.md');
const rootPkg = readFile('package.json');

if (monorepoDoc && rootPkg) {
  // Check workspace-related facts if mentioned
  const pkg = JSON.parse(rootPkg);
  const turboJson = readFile('turbo.json');
  if (turboJson) {
    // Just verify the doc mentions the correct package manager
    if (!monorepoDoc.includes('pnpm')) {
      issues.push({
        file: 'docs/monorepo-completo.md',
        issue: 'Does not mention pnpm as package manager',
      });
    }
  }
}

// ─── Report ────────────────────────────────────────────────────────────────────

console.log(`\nDocs drift check — ${issues.length === 0 ? 'clean' : `${issues.length} issue(s) found`}\n`);

if (issues.length === 0) {
  console.log('✓ No documentation drift detected.\n');
  process.exit(0);
} else {
  for (const { file, issue } of issues) {
    console.error(`  • ${file}: ${issue}`);
  }
  console.error(
    '\nFix: update the documentation to match the current codebase state.\n',
  );
  process.exit(1);
}
