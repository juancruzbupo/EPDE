import { describe, it, expect } from 'vitest';
import {
  createBudgetRequestSchema,
  respondBudgetSchema,
  updateBudgetStatusSchema,
  budgetFiltersSchema,
} from '../schemas/budget';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

describe('createBudgetRequestSchema', () => {
  it('should accept valid input', () => {
    const result = createBudgetRequestSchema.safeParse({
      propertyId: VALID_UUID,
      title: 'Reparación de techo',
      description: 'Filtraciones en el techo del living',
    });
    expect(result.success).toBe(true);
  });

  it('should accept input without optional description', () => {
    const result = createBudgetRequestSchema.safeParse({
      propertyId: VALID_UUID,
      title: 'Reparación de techo',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid propertyId (not UUID)', () => {
    const result = createBudgetRequestSchema.safeParse({
      propertyId: 'not-a-uuid',
      title: 'Reparación de techo',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('ID de propiedad inválido');
    }
  });

  it('should reject title shorter than 3 characters', () => {
    const result = createBudgetRequestSchema.safeParse({
      propertyId: VALID_UUID,
      title: 'AB',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('El título debe tener al menos 3 caracteres');
    }
  });

  it('should reject title longer than 200 characters', () => {
    const result = createBudgetRequestSchema.safeParse({
      propertyId: VALID_UUID,
      title: 'A'.repeat(201),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('El título no puede superar 200 caracteres');
    }
  });

  it('should accept title with exactly 3 characters', () => {
    const result = createBudgetRequestSchema.safeParse({
      propertyId: VALID_UUID,
      title: 'ABC',
    });
    expect(result.success).toBe(true);
  });

  it('should accept title with exactly 200 characters', () => {
    const result = createBudgetRequestSchema.safeParse({
      propertyId: VALID_UUID,
      title: 'A'.repeat(200),
    });
    expect(result.success).toBe(true);
  });

  it('should reject description longer than 2000 characters', () => {
    const result = createBudgetRequestSchema.safeParse({
      propertyId: VALID_UUID,
      title: 'Reparación',
      description: 'A'.repeat(2001),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        'La descripción no puede superar 2000 caracteres',
      );
    }
  });
});

describe('respondBudgetSchema', () => {
  const validLineItem = {
    description: 'Mano de obra',
    quantity: 2,
    unitPrice: 5000,
  };

  it('should accept valid response with line items', () => {
    const result = respondBudgetSchema.safeParse({
      lineItems: [validLineItem],
    });
    expect(result.success).toBe(true);
  });

  it('should accept full response with all optional fields', () => {
    const result = respondBudgetSchema.safeParse({
      lineItems: [validLineItem],
      estimatedDays: 5,
      notes: 'Incluye materiales',
      validUntil: '2026-12-31',
    });
    expect(result.success).toBe(true);
  });

  it('should reject empty lineItems array', () => {
    const result = respondBudgetSchema.safeParse({
      lineItems: [],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Debe agregar al menos un ítem');
    }
  });

  it('should reject line item with empty description', () => {
    const result = respondBudgetSchema.safeParse({
      lineItems: [{ description: '', quantity: 1, unitPrice: 100 }],
    });
    expect(result.success).toBe(false);
  });

  it('should reject line item with zero quantity', () => {
    const result = respondBudgetSchema.safeParse({
      lineItems: [{ description: 'Item', quantity: 0, unitPrice: 100 }],
    });
    expect(result.success).toBe(false);
  });

  it('should reject line item with negative quantity', () => {
    const result = respondBudgetSchema.safeParse({
      lineItems: [{ description: 'Item', quantity: -1, unitPrice: 100 }],
    });
    expect(result.success).toBe(false);
  });

  it('should accept line item with zero unitPrice (nonnegative)', () => {
    const result = respondBudgetSchema.safeParse({
      lineItems: [{ description: 'Item gratuito', quantity: 1, unitPrice: 0 }],
    });
    expect(result.success).toBe(true);
  });

  it('should reject line item with negative unitPrice', () => {
    const result = respondBudgetSchema.safeParse({
      lineItems: [{ description: 'Item', quantity: 1, unitPrice: -100 }],
    });
    expect(result.success).toBe(false);
  });

  it('should coerce string quantities to numbers', () => {
    const result = respondBudgetSchema.safeParse({
      lineItems: [{ description: 'Item', quantity: '3', unitPrice: '100' }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.lineItems[0].quantity).toBe(3);
      expect(result.data.lineItems[0].unitPrice).toBe(100);
    }
  });

  it('should reject non-integer estimatedDays', () => {
    const result = respondBudgetSchema.safeParse({
      lineItems: [validLineItem],
      estimatedDays: 2.5,
    });
    expect(result.success).toBe(false);
  });

  it('should reject zero estimatedDays', () => {
    const result = respondBudgetSchema.safeParse({
      lineItems: [validLineItem],
      estimatedDays: 0,
    });
    expect(result.success).toBe(false);
  });

  it('should reject notes longer than 2000 characters', () => {
    const result = respondBudgetSchema.safeParse({
      lineItems: [validLineItem],
      notes: 'X'.repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid validUntil date format', () => {
    const result = respondBudgetSchema.safeParse({
      lineItems: [validLineItem],
      validUntil: 'not-a-date',
    });
    expect(result.success).toBe(false);
  });

  it('should accept valid ISO date string for validUntil', () => {
    const result = respondBudgetSchema.safeParse({
      lineItems: [validLineItem],
      validUntil: '2026-06-15',
    });
    expect(result.success).toBe(true);
  });
});

describe('updateBudgetStatusSchema', () => {
  it.each(['APPROVED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED'] as const)(
    'should accept status %s',
    (status) => {
      const result = updateBudgetStatusSchema.safeParse({ status });
      expect(result.success).toBe(true);
    },
  );

  it('should reject invalid status', () => {
    const result = updateBudgetStatusSchema.safeParse({ status: 'PENDING' });
    expect(result.success).toBe(false);
  });

  it('should reject empty status', () => {
    const result = updateBudgetStatusSchema.safeParse({ status: '' });
    expect(result.success).toBe(false);
  });

  it('should reject missing status', () => {
    const result = updateBudgetStatusSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('budgetFiltersSchema', () => {
  it('should accept empty object and apply defaults', () => {
    const result = budgetFiltersSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.take).toBe(20);
    }
  });

  it('should accept all valid filter options', () => {
    const result = budgetFiltersSchema.safeParse({
      status: 'QUOTED',
      propertyId: VALID_UUID,
      cursor: VALID_UUID,
      take: 50,
    });
    expect(result.success).toBe(true);
  });

  it.each(['PENDING', 'QUOTED', 'APPROVED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED'] as const)(
    'should accept status filter %s',
    (status) => {
      const result = budgetFiltersSchema.safeParse({ status });
      expect(result.success).toBe(true);
    },
  );

  it('should reject invalid status filter', () => {
    const result = budgetFiltersSchema.safeParse({ status: 'INVALID' });
    expect(result.success).toBe(false);
  });

  it('should reject take less than 1', () => {
    const result = budgetFiltersSchema.safeParse({ take: 0 });
    expect(result.success).toBe(false);
  });

  it('should reject take greater than 100', () => {
    const result = budgetFiltersSchema.safeParse({ take: 101 });
    expect(result.success).toBe(false);
  });

  it('should coerce string take to number', () => {
    const result = budgetFiltersSchema.safeParse({ take: '10' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.take).toBe(10);
    }
  });

  it('should reject non-uuid propertyId', () => {
    const result = budgetFiltersSchema.safeParse({ propertyId: 'abc' });
    expect(result.success).toBe(false);
  });
});
