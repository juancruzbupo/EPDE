import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * Drift guardrail: every field in a Prisma model must appear in the
 * corresponding `XxxPublic` shared type (or be explicitly excluded).
 *
 * Why: the enum sync test (zod-prisma-enum-sync.test.ts) already catches
 * enum value drift. But nothing catches the case where someone adds a
 * new column to a Prisma model (`TechnicalInspection.paymentPlatform`)
 * and forgets to extend `TechnicalInspectionPublic` in shared. The
 * frontend compiles, the API returns the field, but consumers never see
 * it because TypeScript doesn't know it exists.
 *
 * This test:
 *   1. Parses `apps/api/prisma/schema.prisma` extracting { fieldName,
 *      isNullable, isArray } per model (ignoring relations).
 *   2. Parses the shared type file for the corresponding `XxxPublic`
 *      interface (regex-based, not full AST — good enough for field
 *      names).
 *   3. Diffs: every Prisma field must be either (a) in the Public
 *      interface, or (b) in the model's ALLOWED_OMISSIONS list with a
 *      reason in the test file.
 *
 * Adding a new model-to-DTO mapping: update MODEL_DTO_MAP below.
 * Adding an omission: edit ALLOWED_OMISSIONS and document the reason
 * in a comment next to the entry.
 *
 * Design notes:
 *   - We only check field NAMES. Full type-checking (nullable matching,
 *     array-vs-scalar) would need ts-morph; value-for-complexity says no.
 *   - Relations are excluded automatically (detected by capitalized
 *     type names without `@db.` attribute).
 */

const REPO_ROOT = resolve(__dirname, '../../../..');
const PRISMA_SCHEMA = resolve(REPO_ROOT, 'apps/api/prisma/schema.prisma');
const SHARED_TYPES_DIR = resolve(REPO_ROOT, 'packages/shared/src/types');

interface PrismaField {
  name: string;
  /** Raw type string including modifiers (e.g., 'String?', 'DateTime', 'Int[]'). */
  type: string;
  isRelation: boolean;
}

/**
 * Mapping from Prisma model name → { dtoName, relativePath }.
 * Only models with a `XxxPublic` DTO that travels to the frontend are
 * registered here. Internal/admin-only models (counters, audit logs,
 * timeline notes) are omitted since drift doesn't reach users.
 */
const MODEL_DTO_MAP: Record<string, { dto: string; file: string }> = {
  Property: { dto: 'Property', file: 'entities/property.ts' },
  User: { dto: 'User', file: 'entities/user.ts' },
  MaintenancePlan: { dto: 'MaintenancePlan', file: 'entities/maintenance-plan.ts' },
  Task: { dto: 'Task', file: 'entities/task.ts' },
  Category: { dto: 'Category', file: 'entities/category.ts' },
  BudgetRequest: { dto: 'BudgetRequest', file: 'entities/budget.ts' },
  ServiceRequest: { dto: 'ServiceRequest', file: 'entities/service-request.ts' },
  TechnicalInspection: {
    dto: 'TechnicalInspectionPublic',
    file: 'entities/technical-inspection.ts',
  },
  Professional: { dto: 'ProfessionalPublic', file: 'entities/professional.ts' },
  InspectionChecklist: {
    dto: 'InspectionChecklist',
    file: 'entities/inspection.ts',
  },
};

/**
 * Fields intentionally omitted from the public DTO. Each entry documents
 * why: audit columns (createdBy), soft-delete markers (deletedAt),
 * internal state, denormalized caches, etc.
 */
const ALLOWED_OMISSIONS: Record<string, string[]> = {
  Property: [
    'deletedAt', // soft-delete marker
    'createdBy', // audit, admin-internal
    'updatedBy', // audit, admin-internal
    'lastContactedAt', // admin-only contact tracker
  ],
  User: [
    'deletedAt',
    'passwordHash', // security-sensitive
    'activatedAt', // admin-internal
    'lastLoginAt', // admin-internal
    'resetPasswordToken', // security-sensitive
    'resetPasswordTokenExpiresAt',
    'setPasswordToken',
    'setPasswordTokenExpiresAt',
    'invitedBy',
    'referralCode', // derived on demand in profile
    // Referral credit tracking lives in ReferralStatePublic (see entities/referral.ts),
    // not directly on User — consumers use useReferralStats() hook instead.
    'referredByCode',
    'referralCount',
    'convertedCount',
    'referralCreditMonths',
    'referralCreditAnnualDiagnosis',
    'referralCreditBiannualDiagnosis',
  ],
  MaintenancePlan: [
    'createdBy',
    'updatedBy',
    'sourceInspectionId', // internal linkage
    // Pricing tier snapshot — consumed solo por dashboard admin (DashboardStats.planLaunch),
    // no por el cliente. No se expone en MaintenancePlan para no filtrar precios a clientes.
    'priceTier',
    'priceAmount',
  ],
  Task: [
    'deletedAt',
    'createdBy',
    'updatedBy',
    'lastCompletedAt', // denormalized cache; derived from TaskLog
    'assignedToName', // internal denormalization for activity feed
  ],
  Category: ['deletedAt', 'categoryTemplateId'],
  BudgetRequest: ['deletedAt', 'createdBy', 'updatedBy'],
  ServiceRequest: [
    'deletedAt',
    'createdBy',
    'updatedBy',
    'taskId',
    'assignedToName', // denormalized cache; the real assignment is in ServiceRequestAssignment
    'firstResponseAt', // SLA metric, exposed via AdminAnalytics.slaMetrics
    'resolvedAt', // SLA metric
  ],
  TechnicalInspection: ['deletedAt'],
  Professional: ['deletedAt', 'createdBy', 'availableUntil'],
  InspectionChecklist: ['deletedAt'],
};

function parsePrismaModels(schemaPath: string): Map<string, PrismaField[]> {
  const content = readFileSync(schemaPath, 'utf-8');
  const models = new Map<string, PrismaField[]>();
  const modelRegex = /model\s+(\w+)\s*\{([^}]+)\}/g;

  for (const match of content.matchAll(modelRegex)) {
    const [, name, body] = match;
    if (!name || !body) continue;
    const fields: PrismaField[] = [];

    for (const rawLine of body.split('\n')) {
      const line = rawLine.replace(/\/\/.*$/, '').trim();
      if (!line) continue;
      if (line.startsWith('@@')) continue; // model-level attributes
      if (line.startsWith('//')) continue;

      // Match `fieldName Type(?|[]) ...modifiers`
      const fieldMatch = line.match(/^(\w+)\s+(\S+)/);
      if (!fieldMatch) continue;
      const [, fieldName, fieldType] = fieldMatch;
      if (!fieldName || !fieldType) continue;

      // Relations: type starts with capital, and no @db./Int/String/etc
      // Simpler heuristic: presence of `@relation` OR type is a PascalCase
      // name that matches another model (we don't check cross-model here;
      // use the @relation hint or fk pattern `@default()`/`@db.` absence).
      const isRelation =
        line.includes('@relation') ||
        (/^[A-Z]/.test(fieldType) &&
          !['String', 'Int', 'Float', 'Boolean', 'DateTime', 'Json', 'Decimal', 'Bytes'].some((p) =>
            fieldType.startsWith(p),
          ));

      fields.push({ name: fieldName, type: fieldType, isRelation });
    }

    models.set(name, fields);
  }

  return models;
}

/**
 * Fields inherited from base interfaces (BaseEntity, SoftDeletable) —
 * ya están cubiertos por esas interfaces y no necesitan redeclarar.
 */
const BASE_INTERFACE_FIELDS = new Set(['id', 'createdAt', 'updatedAt', 'deletedAt']);

function parseDtoFields(filePath: string, dtoName: string): Set<string> {
  const content = readFileSync(filePath, 'utf-8');
  // Match `export interface DtoName [extends ...] { ... }` across newlines
  const interfaceRegex = new RegExp(
    `export\\s+interface\\s+${dtoName}(?:\\s+extends\\s+[^{]+)?\\s*\\{([\\s\\S]*?)\\n\\}`,
    'm',
  );
  const match = content.match(interfaceRegex);
  if (!match) throw new Error(`DTO ${dtoName} not found in ${filePath}`);
  const body = match[1] ?? '';

  const fields = new Set<string>(BASE_INTERFACE_FIELDS);
  for (const rawLine of body.split('\n')) {
    const line = rawLine.replace(/\/\/.*$/, '').trim();
    if (!line) continue;
    const fieldMatch = line.match(/^(\w+)[?:]/);
    if (fieldMatch && fieldMatch[1]) fields.add(fieldMatch[1]);
  }
  return fields;
}

describe('Prisma ↔ DTO field sync', () => {
  const prismaModels = parsePrismaModels(PRISMA_SCHEMA);

  for (const [modelName, { dto, file }] of Object.entries(MODEL_DTO_MAP)) {
    it(`${modelName} fields are reflected in ${dto} (or explicitly omitted)`, () => {
      const prismaFields = prismaModels.get(modelName);
      expect(prismaFields, `Prisma model ${modelName} not found`).toBeDefined();

      const dtoFields = parseDtoFields(resolve(SHARED_TYPES_DIR, file), dto);
      const allowedOmissions = new Set(ALLOWED_OMISSIONS[modelName] ?? []);

      const scalarFields = (prismaFields ?? []).filter((f) => !f.isRelation);
      const missing: string[] = [];

      for (const field of scalarFields) {
        if (dtoFields.has(field.name)) continue;
        if (allowedOmissions.has(field.name)) continue;
        missing.push(`${field.name} (${field.type})`);
      }

      expect(
        missing,
        `Fields in ${modelName} (Prisma) missing from ${dto} (shared): ${missing.join(', ')}. ` +
          `Either add them to the DTO, or add the field name to ALLOWED_OMISSIONS['${modelName}'] ` +
          `with a comment explaining why it's excluded (audit column, security-sensitive, etc).`,
      ).toEqual([]);
    });
  }
});
