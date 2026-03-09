import { describe, expect, it } from 'vitest';

import {
  createServiceRequestSchema,
  serviceRequestFiltersSchema,
  updateServiceStatusSchema,
} from '../schemas/service-request';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

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
