import { describe, it, expect } from 'vitest';
import { createTaskSchema, updateTaskSchema, reorderTasksSchema } from '../schemas/task';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

describe('createTaskSchema', () => {
  const validInput = {
    maintenancePlanId: VALID_UUID,
    categoryId: VALID_UUID,
    name: 'Revisar caldera',
    nextDueDate: '2026-06-15',
  };

  it('should accept valid input with required fields', () => {
    const result = createTaskSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.priority).toBe('MEDIUM');
      expect(result.data.recurrenceType).toBe('ANNUAL');
    }
  });

  it('should default priority to MEDIUM', () => {
    const result = createTaskSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.priority).toBe('MEDIUM');
    }
  });

  it('should default recurrenceType to ANNUAL', () => {
    const result = createTaskSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.recurrenceType).toBe('ANNUAL');
    }
  });

  it('should accept valid input with all optional fields', () => {
    const result = createTaskSchema.safeParse({
      ...validInput,
      description: 'Mantenimiento anual de la caldera',
      priority: 'HIGH',
      recurrenceType: 'QUARTERLY',
      recurrenceMonths: 3,
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid maintenancePlanId', () => {
    const result = createTaskSchema.safeParse({
      ...validInput,
      maintenancePlanId: 'not-uuid',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('ID de plan inválido');
    }
  });

  it('should reject invalid categoryId', () => {
    const result = createTaskSchema.safeParse({
      ...validInput,
      categoryId: 'not-uuid',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('ID de categoría inválido');
    }
  });

  it('should reject name shorter than 2 characters', () => {
    const result = createTaskSchema.safeParse({
      ...validInput,
      name: 'A',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('El nombre debe tener al menos 2 caracteres');
    }
  });

  it.each(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const)('should accept priority %s', (priority) => {
    const result = createTaskSchema.safeParse({ ...validInput, priority });
    expect(result.success).toBe(true);
  });

  it.each(['MONTHLY', 'QUARTERLY', 'BIANNUAL', 'ANNUAL', 'CUSTOM'] as const)(
    'should accept recurrenceType %s',
    (recurrenceType) => {
      const result = createTaskSchema.safeParse({
        ...validInput,
        recurrenceType,
      });
      expect(result.success).toBe(true);
    },
  );

  it('should reject recurrenceMonths below 1', () => {
    const result = createTaskSchema.safeParse({
      ...validInput,
      recurrenceMonths: 0,
    });
    expect(result.success).toBe(false);
  });

  it('should reject recurrenceMonths above 120', () => {
    const result = createTaskSchema.safeParse({
      ...validInput,
      recurrenceMonths: 121,
    });
    expect(result.success).toBe(false);
  });

  it('should accept recurrenceMonths at boundaries (1 and 120)', () => {
    expect(createTaskSchema.safeParse({ ...validInput, recurrenceMonths: 1 }).success).toBe(true);
    expect(createTaskSchema.safeParse({ ...validInput, recurrenceMonths: 120 }).success).toBe(true);
  });

  it('should coerce string nextDueDate to Date', () => {
    const result = createTaskSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.nextDueDate).toBeInstanceOf(Date);
    }
  });

  it('should coerce Date object for nextDueDate', () => {
    const result = createTaskSchema.safeParse({
      ...validInput,
      nextDueDate: new Date('2026-06-15'),
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.nextDueDate).toBeInstanceOf(Date);
    }
  });
});

describe('updateTaskSchema', () => {
  it('should accept empty object (all fields optional)', () => {
    const result = updateTaskSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should accept partial updates', () => {
    const result = updateTaskSchema.safeParse({
      name: 'Nuevo nombre',
      priority: 'HIGH',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid name (too short)', () => {
    const result = updateTaskSchema.safeParse({ name: 'A' });
    expect(result.success).toBe(false);
  });

  it('should reject invalid categoryId', () => {
    const result = updateTaskSchema.safeParse({ categoryId: 'not-uuid' });
    expect(result.success).toBe(false);
  });

  it.each(['PENDING', 'UPCOMING', 'OVERDUE', 'COMPLETED'] as const)(
    'should accept status %s',
    (status) => {
      const result = updateTaskSchema.safeParse({ status });
      expect(result.success).toBe(true);
    },
  );

  it('should reject invalid status', () => {
    const result = updateTaskSchema.safeParse({ status: 'CANCELLED' });
    expect(result.success).toBe(false);
  });

  it('should accept nextDueDate as optional', () => {
    const result = updateTaskSchema.safeParse({
      nextDueDate: '2026-12-01',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.nextDueDate).toBeInstanceOf(Date);
    }
  });
});

describe('reorderTasksSchema', () => {
  it('should accept valid task reorder array', () => {
    const result = reorderTasksSchema.safeParse({
      tasks: [
        { id: VALID_UUID, order: 0 },
        { id: '660e8400-e29b-41d4-a716-446655440000', order: 1 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('should accept empty tasks array', () => {
    const result = reorderTasksSchema.safeParse({ tasks: [] });
    expect(result.success).toBe(true);
  });

  it('should reject task with invalid UUID', () => {
    const result = reorderTasksSchema.safeParse({
      tasks: [{ id: 'not-uuid', order: 0 }],
    });
    expect(result.success).toBe(false);
  });

  it('should reject task with negative order', () => {
    const result = reorderTasksSchema.safeParse({
      tasks: [{ id: VALID_UUID, order: -1 }],
    });
    expect(result.success).toBe(false);
  });

  it('should reject task with non-integer order', () => {
    const result = reorderTasksSchema.safeParse({
      tasks: [{ id: VALID_UUID, order: 1.5 }],
    });
    expect(result.success).toBe(false);
  });

  it('should accept task with order 0', () => {
    const result = reorderTasksSchema.safeParse({
      tasks: [{ id: VALID_UUID, order: 0 }],
    });
    expect(result.success).toBe(true);
  });

  it('should reject missing tasks field', () => {
    const result = reorderTasksSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
