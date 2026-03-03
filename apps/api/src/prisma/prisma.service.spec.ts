import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import type { ZodObject, ZodRawShape } from 'zod';
import { PrismaService, SOFT_DELETABLE_MODELS, hasDeletedAtKey } from './prisma.service';
import { createPropertySchema, createTaskSchema, createBudgetRequestSchema } from '@epde/shared';

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('softDelete extension', () => {
    it('should return a cached extended client via softDelete getter', () => {
      const ext1 = service.softDelete;
      const ext2 = service.softDelete;
      expect(ext1).toBe(ext2);
    });
  });

  describe('softDeleteHandlers - key presence check', () => {
    /**
     * The soft delete extension auto-adds `deletedAt: null` to queries
     * ONLY when the `deletedAt` key is NOT present in the where clause.
     *
     * This tests the fix for the bug where `deletedAt === undefined`
     * (value check) was used instead of `'deletedAt' in where` (key check).
     */

    // We test the logic indirectly by examining that the softDelete getter
    // returns an extended client. The actual filter behavior is tested
    // via integration tests since Prisma extensions intercept at the query level.

    it('should expose softDeleteRecord method', () => {
      expect(typeof service.softDeleteRecord).toBe('function');
    });

    it('should expose softDelete getter that returns extended client', () => {
      const extended = service.softDelete;
      expect(extended).toBeDefined();
      // The extended client should have the same model accessors
      expect(extended.user).toBeDefined();
      expect(extended.property).toBeDefined();
      expect(extended.task).toBeDefined();
    });
  });
});

describe('PrismaService soft-delete consistency', () => {
  it('should include all models with deletedAt field in SOFT_DELETABLE_MODELS', () => {
    const modelsWithDeletedAt = Prisma.dmmf.datamodel.models
      .filter((model) => model.fields.some((f) => f.name === 'deletedAt'))
      .map((model) => {
        // Convert PascalCase model name to camelCase for Prisma client access
        const name = model.name;
        return name.charAt(0).toLowerCase() + name.slice(1);
      });

    for (const modelName of modelsWithDeletedAt) {
      expect(SOFT_DELETABLE_MODELS).toContain(modelName);
    }
  });

  it('should not include models without deletedAt in SOFT_DELETABLE_MODELS', () => {
    const modelsWithDeletedAt = new Set(
      Prisma.dmmf.datamodel.models
        .filter((model) => model.fields.some((f) => f.name === 'deletedAt'))
        .map((model) => {
          const name = model.name;
          return name.charAt(0).toLowerCase() + name.slice(1);
        }),
    );

    for (const modelName of SOFT_DELETABLE_MODELS) {
      expect(modelsWithDeletedAt.has(modelName)).toBe(true);
    }
  });
});

describe('hasDeletedAtKey – nested edge cases', () => {
  it('returns true when deletedAt is at root level', () => {
    expect(hasDeletedAtKey({ deletedAt: null })).toBe(true);
    expect(hasDeletedAtKey({ deletedAt: { not: null } })).toBe(true);
  });

  it('returns false for empty where', () => {
    expect(hasDeletedAtKey({})).toBe(false);
  });

  it('returns true when deletedAt is inside AND array', () => {
    expect(hasDeletedAtKey({ AND: [{ deletedAt: null }, { status: 'ACTIVE' }] })).toBe(true);
  });

  it('returns true when deletedAt is inside OR array', () => {
    expect(hasDeletedAtKey({ OR: [{ deletedAt: null }] })).toBe(true);
  });

  it('returns true when deletedAt is inside NOT object', () => {
    expect(hasDeletedAtKey({ NOT: { deletedAt: { not: null } } })).toBe(true);
  });

  it('returns false when no deletedAt exists in nested operators', () => {
    expect(hasDeletedAtKey({ AND: [{ status: 'ACTIVE' }], OR: [{ name: 'x' }], NOT: { role: 'ADMIN' } })).toBe(false);
  });
});

describe('Zod-Prisma schema consistency', () => {
  /**
   * Verify that non-auto required Prisma fields are present in the corresponding Zod create schema.
   * Fields in AUTO_FIELDS are intentionally omitted from create inputs (server-generated).
   * Relation fields are also excluded (they appear as FK scalar fields, not objects).
   */
  // Auto/server-set fields that are never included in client create schemas
  const AUTO_FIELDS = new Set([
    'id', 'createdAt', 'updatedAt', 'deletedAt',
    'status',   // defaulted server-side
    'order',    // defaulted server-side
    'requestedBy', // set from authenticated user context (JWT)
    'updatedBy',   // set from authenticated user context (JWT)
    'version',     // optimistic concurrency control — managed by Prisma
  ]);

  /** Returns the required non-auto scalar field names for a Prisma model. */
  function requiredScalarFields(modelName: string): string[] {
    const model = Prisma.dmmf.datamodel.models.find((m) => m.name === modelName);
    if (!model) return [];
    return model.fields
      .filter(
        (f) =>
          f.isRequired &&
          !AUTO_FIELDS.has(f.name) &&
          !f.relationName && // exclude virtual relation fields
          f.kind === 'scalar',
      )
      .map((f) => f.name);
  }

  /** Returns the key set of a plain ZodObject schema. */
  function zodKeys(schema: ZodObject<ZodRawShape>): Set<string> {
    return new Set(Object.keys(schema.shape));
  }

  it('createPropertySchema covers all required Property scalar fields', () => {
    const fields = requiredScalarFields('Property');
    const keys = zodKeys(createPropertySchema);
    for (const field of fields) {
      expect(keys).toContain(field);
    }
  });

  it('createTaskSchema covers all required Task scalar fields', () => {
    const fields = requiredScalarFields('Task');
    const keys = zodKeys(createTaskSchema);
    for (const field of fields) {
      expect(keys).toContain(field);
    }
  });

  it('createBudgetRequestSchema covers all required BudgetRequest scalar fields', () => {
    const fields = requiredScalarFields('BudgetRequest');
    const keys = zodKeys(createBudgetRequestSchema);
    for (const field of fields) {
      expect(keys).toContain(field);
    }
  });
});
