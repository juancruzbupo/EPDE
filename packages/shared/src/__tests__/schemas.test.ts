import { describe, it, expect } from 'vitest';
import { loginSchema, setPasswordSchema, refreshSchema } from '../schemas/auth';
import {
  createBudgetRequestSchema,
  respondBudgetSchema,
  updateBudgetStatusSchema,
  budgetFiltersSchema,
} from '../schemas/budget';
import {
  createPropertySchema,
  updatePropertySchema,
  propertyFiltersSchema,
} from '../schemas/property';
import {
  createServiceRequestSchema,
  updateServiceStatusSchema,
  serviceRequestFiltersSchema,
} from '../schemas/service-request';
import { createTaskSchema, updateTaskSchema, reorderTasksSchema } from '../schemas/task';

// ═══════════════════════════════════════════════════════════
// AUTH SCHEMAS
// ═══════════════════════════════════════════════════════════

describe('loginSchema', () => {
  it('should accept valid email and password', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'secret123',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid email', () => {
    const result = loginSchema.safeParse({
      email: 'not-an-email',
      password: 'secret123',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Email inválido');
    }
  });

  it('should reject empty email', () => {
    const result = loginSchema.safeParse({
      email: '',
      password: 'secret123',
    });
    expect(result.success).toBe(false);
  });

  it('should reject password shorter than 6 characters', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: '12345',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('La contraseña debe tener al menos 6 caracteres');
    }
  });

  it('should accept password with exactly 6 characters', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: '123456',
    });
    expect(result.success).toBe(true);
  });

  it('should reject missing fields', () => {
    const result = loginSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('setPasswordSchema', () => {
  it('should accept valid token and strong password', () => {
    const result = setPasswordSchema.safeParse({
      token: 'some-valid-token',
      newPassword: 'Abcdefg1',
    });
    expect(result.success).toBe(true);
  });

  it('should reject empty token', () => {
    const result = setPasswordSchema.safeParse({
      token: '',
      newPassword: 'Abcdefg1',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Token requerido');
    }
  });

  it('should reject password shorter than 8 characters', () => {
    const result = setPasswordSchema.safeParse({
      token: 'tok',
      newPassword: 'Abc1',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain('La contraseña debe tener al menos 8 caracteres');
    }
  });

  it('should reject password without uppercase letter', () => {
    const result = setPasswordSchema.safeParse({
      token: 'tok',
      newPassword: 'abcdefg1',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain('Debe contener al menos una mayúscula');
    }
  });

  it('should reject password without lowercase letter', () => {
    const result = setPasswordSchema.safeParse({
      token: 'tok',
      newPassword: 'ABCDEFG1',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain('Debe contener al menos una minúscula');
    }
  });

  it('should reject password without number', () => {
    const result = setPasswordSchema.safeParse({
      token: 'tok',
      newPassword: 'Abcdefgh',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain('Debe contener al menos un número');
    }
  });

  it('should accept password meeting all criteria', () => {
    const result = setPasswordSchema.safeParse({
      token: 'valid-token',
      newPassword: 'MyP4ssword',
    });
    expect(result.success).toBe(true);
  });
});

describe('refreshSchema', () => {
  it('should accept object with refreshToken', () => {
    const result = refreshSchema.safeParse({
      refreshToken: 'some-refresh-token',
    });
    expect(result.success).toBe(true);
  });

  it('should accept object without refreshToken (optional)', () => {
    const result = refreshSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should accept object with undefined refreshToken', () => {
    const result = refreshSchema.safeParse({ refreshToken: undefined });
    expect(result.success).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════
// BUDGET SCHEMAS
// ═══════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════
// PROPERTY SCHEMAS
// ═══════════════════════════════════════════════════════════

describe('createPropertySchema', () => {
  const validInput = {
    userId: VALID_UUID,
    address: 'Av. Corrientes 1234',
    city: 'Buenos Aires',
  };

  it('should accept valid input with required fields only', () => {
    const result = createPropertySchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe('HOUSE');
    }
  });

  it('should accept valid input with all optional fields', () => {
    const result = createPropertySchema.safeParse({
      ...validInput,
      type: 'APARTMENT',
      yearBuilt: 2020,
      squareMeters: 150,
    });
    expect(result.success).toBe(true);
  });

  it('should default type to HOUSE', () => {
    const result = createPropertySchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe('HOUSE');
    }
  });

  it('should reject invalid userId (not UUID)', () => {
    const result = createPropertySchema.safeParse({
      ...validInput,
      userId: 'not-uuid',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('ID de usuario inválido');
    }
  });

  it('should reject address shorter than 3 characters', () => {
    const result = createPropertySchema.safeParse({
      ...validInput,
      address: 'AB',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('La dirección debe tener al menos 3 caracteres');
    }
  });

  it('should reject city shorter than 2 characters', () => {
    const result = createPropertySchema.safeParse({
      ...validInput,
      city: 'A',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('La ciudad debe tener al menos 2 caracteres');
    }
  });

  it.each(['HOUSE', 'APARTMENT', 'DUPLEX', 'COUNTRY_HOUSE', 'OTHER'] as const)(
    'should accept property type %s',
    (type) => {
      const result = createPropertySchema.safeParse({ ...validInput, type });
      expect(result.success).toBe(true);
    },
  );

  it('should reject invalid property type', () => {
    const result = createPropertySchema.safeParse({
      ...validInput,
      type: 'CASTLE',
    });
    expect(result.success).toBe(false);
  });

  it('should reject yearBuilt below 1800', () => {
    const result = createPropertySchema.safeParse({
      ...validInput,
      yearBuilt: 1799,
    });
    expect(result.success).toBe(false);
  });

  it('should reject yearBuilt above 2100', () => {
    const result = createPropertySchema.safeParse({
      ...validInput,
      yearBuilt: 2101,
    });
    expect(result.success).toBe(false);
  });

  it('should accept yearBuilt at boundaries (1800 and 2100)', () => {
    expect(createPropertySchema.safeParse({ ...validInput, yearBuilt: 1800 }).success).toBe(true);
    expect(createPropertySchema.safeParse({ ...validInput, yearBuilt: 2100 }).success).toBe(true);
  });

  it('should reject non-positive squareMeters', () => {
    const result = createPropertySchema.safeParse({
      ...validInput,
      squareMeters: 0,
    });
    expect(result.success).toBe(false);
  });

  it('should reject negative squareMeters', () => {
    const result = createPropertySchema.safeParse({
      ...validInput,
      squareMeters: -10,
    });
    expect(result.success).toBe(false);
  });

  it('should coerce string yearBuilt to number', () => {
    const result = createPropertySchema.safeParse({
      ...validInput,
      yearBuilt: '2020',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.yearBuilt).toBe(2020);
    }
  });

  it('should coerce string squareMeters to number', () => {
    const result = createPropertySchema.safeParse({
      ...validInput,
      squareMeters: '120',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.squareMeters).toBe(120);
    }
  });
});

describe('updatePropertySchema', () => {
  it('should accept empty object (all fields optional)', () => {
    const result = updatePropertySchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should accept partial updates', () => {
    const result = updatePropertySchema.safeParse({
      address: 'Nueva dirección 456',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid address (too short)', () => {
    const result = updatePropertySchema.safeParse({ address: 'AB' });
    expect(result.success).toBe(false);
  });

  it('should reject invalid city (too short)', () => {
    const result = updatePropertySchema.safeParse({ city: 'A' });
    expect(result.success).toBe(false);
  });

  it('should reject invalid type', () => {
    const result = updatePropertySchema.safeParse({ type: 'MANSION' });
    expect(result.success).toBe(false);
  });
});

describe('propertyFiltersSchema', () => {
  it('should accept empty object and apply defaults', () => {
    const result = propertyFiltersSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.take).toBe(20);
    }
  });

  it('should accept all filter options', () => {
    const result = propertyFiltersSchema.safeParse({
      search: 'corrientes',
      userId: VALID_UUID,
      city: 'Buenos Aires',
      type: 'APARTMENT',
      cursor: VALID_UUID,
      take: 10,
    });
    expect(result.success).toBe(true);
  });

  it('should reject non-uuid userId', () => {
    const result = propertyFiltersSchema.safeParse({ userId: 'abc' });
    expect(result.success).toBe(false);
  });

  it('should reject take out of range', () => {
    expect(propertyFiltersSchema.safeParse({ take: 0 }).success).toBe(false);
    expect(propertyFiltersSchema.safeParse({ take: 101 }).success).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════
// SERVICE REQUEST SCHEMAS
// ═══════════════════════════════════════════════════════════

describe('createServiceRequestSchema', () => {
  const validInput = {
    propertyId: VALID_UUID,
    title: 'Pérdida de agua',
    description: 'Hay una pérdida de agua en la cocina debajo de la mesada',
  };

  it('should accept valid input with required fields', () => {
    const result = createServiceRequestSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.urgency).toBe('MEDIUM');
    }
  });

  it('should default urgency to MEDIUM', () => {
    const result = createServiceRequestSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.urgency).toBe('MEDIUM');
    }
  });

  it('should accept valid input with all optional fields', () => {
    const result = createServiceRequestSchema.safeParse({
      ...validInput,
      urgency: 'HIGH',
      photoUrls: ['https://example.com/photo1.jpg'],
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid propertyId', () => {
    const result = createServiceRequestSchema.safeParse({
      ...validInput,
      propertyId: 'invalid',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('ID de propiedad inválido');
    }
  });

  it('should reject title shorter than 3 characters', () => {
    const result = createServiceRequestSchema.safeParse({
      ...validInput,
      title: 'AB',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('El título debe tener al menos 3 caracteres');
    }
  });

  it('should reject title longer than 200 characters', () => {
    const result = createServiceRequestSchema.safeParse({
      ...validInput,
      title: 'X'.repeat(201),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('El título no puede superar 200 caracteres');
    }
  });

  it('should reject description shorter than 10 characters', () => {
    const result = createServiceRequestSchema.safeParse({
      ...validInput,
      description: 'Corta',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        'La descripción debe tener al menos 10 caracteres',
      );
    }
  });

  it('should reject description longer than 2000 characters', () => {
    const result = createServiceRequestSchema.safeParse({
      ...validInput,
      description: 'X'.repeat(2001),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        'La descripción no puede superar 2000 caracteres',
      );
    }
  });

  it.each(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const)('should accept urgency %s', (urgency) => {
    const result = createServiceRequestSchema.safeParse({
      ...validInput,
      urgency,
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid urgency', () => {
    const result = createServiceRequestSchema.safeParse({
      ...validInput,
      urgency: 'CRITICAL',
    });
    expect(result.success).toBe(false);
  });

  it('should accept up to 5 photo URLs', () => {
    const result = createServiceRequestSchema.safeParse({
      ...validInput,
      photoUrls: [
        'https://example.com/1.jpg',
        'https://example.com/2.jpg',
        'https://example.com/3.jpg',
        'https://example.com/4.jpg',
        'https://example.com/5.jpg',
      ],
    });
    expect(result.success).toBe(true);
  });

  it('should reject more than 5 photo URLs', () => {
    const result = createServiceRequestSchema.safeParse({
      ...validInput,
      photoUrls: [
        'https://example.com/1.jpg',
        'https://example.com/2.jpg',
        'https://example.com/3.jpg',
        'https://example.com/4.jpg',
        'https://example.com/5.jpg',
        'https://example.com/6.jpg',
      ],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Máximo 5 fotos');
    }
  });

  it('should reject invalid photo URLs', () => {
    const result = createServiceRequestSchema.safeParse({
      ...validInput,
      photoUrls: ['not-a-url'],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('URL de foto inválida');
    }
  });

  it('should accept empty photoUrls array', () => {
    const result = createServiceRequestSchema.safeParse({
      ...validInput,
      photoUrls: [],
    });
    expect(result.success).toBe(true);
  });
});

describe('updateServiceStatusSchema', () => {
  it.each(['IN_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const)(
    'should accept status %s',
    (status) => {
      const result = updateServiceStatusSchema.safeParse({ status });
      expect(result.success).toBe(true);
    },
  );

  it('should reject invalid status', () => {
    const result = updateServiceStatusSchema.safeParse({ status: 'OPEN' });
    expect(result.success).toBe(false);
  });

  it('should reject missing status', () => {
    const result = updateServiceStatusSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('serviceRequestFiltersSchema', () => {
  it('should accept empty object and apply defaults', () => {
    const result = serviceRequestFiltersSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.take).toBe(20);
    }
  });

  it('should accept all filter options', () => {
    const result = serviceRequestFiltersSchema.safeParse({
      status: 'OPEN',
      urgency: 'HIGH',
      propertyId: VALID_UUID,
      cursor: VALID_UUID,
      take: 50,
    });
    expect(result.success).toBe(true);
  });

  it.each(['OPEN', 'IN_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const)(
    'should accept status filter %s',
    (status) => {
      const result = serviceRequestFiltersSchema.safeParse({ status });
      expect(result.success).toBe(true);
    },
  );

  it.each(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const)(
    'should accept urgency filter %s',
    (urgency) => {
      const result = serviceRequestFiltersSchema.safeParse({ urgency });
      expect(result.success).toBe(true);
    },
  );

  it('should reject invalid status filter', () => {
    const result = serviceRequestFiltersSchema.safeParse({
      status: 'UNKNOWN',
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid urgency filter', () => {
    const result = serviceRequestFiltersSchema.safeParse({
      urgency: 'SUPER_URGENT',
    });
    expect(result.success).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════
// TASK SCHEMAS
// ═══════════════════════════════════════════════════════════

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
