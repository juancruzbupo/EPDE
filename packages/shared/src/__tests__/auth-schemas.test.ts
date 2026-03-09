import { describe, expect, it } from 'vitest';

import { loginSchema, refreshSchema, setPasswordSchema } from '../schemas/auth';

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

  it('should reject password shorter than 8 characters', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: '1234567',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('La contraseña debe tener al menos 8 caracteres');
    }
  });

  it('should accept password with exactly 8 characters', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: '12345678',
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
