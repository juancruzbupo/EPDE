import { describe, expect, it } from 'vitest';

import { buildReferralShareMessage } from '../utils/referral-share';

describe('buildReferralShareMessage', () => {
  it('includes the referral code and URL verbatim', () => {
    const message = buildReferralShareMessage('JUAN-A7K', 'https://epde.com.ar/?ref=JUAN-A7K');

    expect(message).toContain('JUAN-A7K');
    expect(message).toContain('https://epde.com.ar/?ref=JUAN-A7K');
  });

  it('mentions the 10% discount and the product name so the receiver gets the pitch', () => {
    const message = buildReferralShareMessage('MARIA-B22', 'https://epde.com.ar/?ref=MARIA-B22');

    expect(message).toContain('EPDE');
    expect(message).toContain('10% de descuento');
  });
});
