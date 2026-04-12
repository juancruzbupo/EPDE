import { EmailAwareThrottlerGuard } from './email-aware-throttler.guard';

describe('EmailAwareThrottlerGuard', () => {
  let guard: EmailAwareThrottlerGuard;

  beforeEach(() => {
    // ThrottlerGuard requires injected deps, but we only test getTracker
    // which is a pure method — safe to instantiate with null deps
    guard = Object.create(EmailAwareThrottlerGuard.prototype);
  });

  describe('getTracker', () => {
    const makeReq = (ip: string, email?: unknown) =>
      ({ ip, body: email !== undefined ? { email } : {} }) as never;

    it('returns ip:email when email is present in body', async () => {
      const result = await guard['getTracker'](makeReq('1.2.3.4', 'User@Test.COM'));
      expect(result).toBe('1.2.3.4:user@test.com');
    });

    it('normalizes email to lowercase and trims whitespace', async () => {
      const result = await guard['getTracker'](makeReq('1.2.3.4', '  Admin@EPDE.AR  '));
      expect(result).toBe('1.2.3.4:admin@epde.ar');
    });

    it('returns IP only when email is missing from body', async () => {
      const result = await guard['getTracker'](makeReq('1.2.3.4'));
      expect(result).toBe('1.2.3.4');
    });

    it('returns IP only when email is empty string', async () => {
      const result = await guard['getTracker'](makeReq('1.2.3.4', ''));
      expect(result).toBe('1.2.3.4');
    });

    it('returns IP only when email is not a string', async () => {
      const result = await guard['getTracker'](makeReq('1.2.3.4', 123));
      expect(result).toBe('1.2.3.4');
    });

    it('uses "unknown" when req.ip is undefined', async () => {
      const result = await guard['getTracker'](makeReq(undefined as never, 'a@b.com'));
      expect(result).toBe('unknown:a@b.com');
    });
  });
});
