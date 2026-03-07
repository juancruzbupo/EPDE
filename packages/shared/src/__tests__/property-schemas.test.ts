import { describe, it, expect } from 'vitest';
import {
  createPropertySchema,
  updatePropertySchema,
  propertyFiltersSchema,
} from '../schemas/property';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

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
