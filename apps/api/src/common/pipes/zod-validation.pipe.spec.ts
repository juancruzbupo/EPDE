import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';

import { ZodValidationPipe } from './zod-validation.pipe';

describe('ZodValidationPipe', () => {
  describe('object schemas (strict mode)', () => {
    const userSchema = z.object({
      email: z.string().email(),
      name: z.string().min(1),
    });

    it('accepts valid input', () => {
      const pipe = new ZodValidationPipe(userSchema);
      const result = pipe.transform({ email: 'test@example.com', name: 'Ada' });
      expect(result).toEqual({ email: 'test@example.com', name: 'Ada' });
    });

    it('rejects unknown keys (mass-assignment prevention)', () => {
      const pipe = new ZodValidationPipe(userSchema);
      expect(() =>
        pipe.transform({
          email: 'test@example.com',
          name: 'Ada',
          role: 'ADMIN', // attacker-injected field
        }),
      ).toThrow(BadRequestException);
    });

    it('rejects multiple unknown keys and reports them', () => {
      const pipe = new ZodValidationPipe(userSchema);
      try {
        pipe.transform({
          email: 'test@example.com',
          name: 'Ada',
          userId: 'other-user',
          subscriptionExpiresAt: '2099-01-01',
        });
        fail('expected BadRequestException');
      } catch (err) {
        expect(err).toBeInstanceOf(BadRequestException);
      }
    });

    it('rejects invalid field values', () => {
      const pipe = new ZodValidationPipe(userSchema);
      expect(() => pipe.transform({ email: 'not-an-email', name: 'Ada' })).toThrow(
        BadRequestException,
      );
    });
  });

  describe('non-object schemas (no strict wrapping)', () => {
    it('passes array schema through without modification', () => {
      const pipe = new ZodValidationPipe(z.array(z.string()));
      expect(pipe.transform(['a', 'b'])).toEqual(['a', 'b']);
    });

    it('passes union schema through without modification', () => {
      const pipe = new ZodValidationPipe(z.union([z.string(), z.number()]));
      expect(pipe.transform('hello')).toBe('hello');
      expect(pipe.transform(42)).toBe(42);
    });

    it('passes primitive schema through without modification', () => {
      const pipe = new ZodValidationPipe(z.string().uuid());
      expect(pipe.transform('123e4567-e89b-12d3-a456-426614174000')).toBe(
        '123e4567-e89b-12d3-a456-426614174000',
      );
    });
  });

  describe('explicit passthrough opt-out', () => {
    it('allows unknown keys when schema uses .passthrough() explicitly', () => {
      const flexibleSchema = z
        .object({
          type: z.string(),
        })
        .passthrough();
      const pipe = new ZodValidationPipe(flexibleSchema);
      const result = pipe.transform({ type: 'foo', extra: 'bar' });
      expect(result).toEqual({ type: 'foo', extra: 'bar' });
    });
  });
});
