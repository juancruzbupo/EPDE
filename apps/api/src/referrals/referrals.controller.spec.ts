import { Test, TestingModule } from '@nestjs/testing';

import { ReferralsController } from './referrals.controller';
import { ReferralsService } from './referrals.service';

describe('ReferralsController', () => {
  let controller: ReferralsController;
  let service: { getReferralStateForUser: jest.Mock };

  beforeEach(async () => {
    service = { getReferralStateForUser: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReferralsController],
      providers: [{ provide: ReferralsService, useValue: service }],
    }).compile();
    controller = module.get(ReferralsController);
  });

  it('wraps the service result in { data }', async () => {
    const state = { referralCode: 'MARIA-K3P' };
    service.getReferralStateForUser.mockResolvedValue(state);

    const result = await controller.getMyReferrals({ id: 'u1' } as never);

    expect(service.getReferralStateForUser).toHaveBeenCalledWith('u1');
    expect(result).toEqual({ data: state });
  });
});
