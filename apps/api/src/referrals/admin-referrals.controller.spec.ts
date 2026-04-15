import { APP_GUARD, Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';

import { StrictBlacklistGuard } from '../common/guards/strict-blacklist.guard';
import { AdminReferralsController } from './admin-referrals.controller';
import { ReferralsService } from './referrals.service';

describe('AdminReferralsController', () => {
  let controller: AdminReferralsController;
  let service: {
    getReferralStateForUser: jest.Mock;
    markConvertedById: jest.Mock;
    recomputeReferrerState: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      getReferralStateForUser: jest.fn(),
      markConvertedById: jest.fn(),
      recomputeReferrerState: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminReferralsController],
      providers: [
        { provide: ReferralsService, useValue: service },
        { provide: Reflector, useValue: new Reflector() },
        { provide: APP_GUARD, useValue: { canActivate: () => true } },
      ],
    })
      .overrideGuard(StrictBlacklistGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(AdminReferralsController);
  });

  it('getUserReferrals forwards the userId and wraps the state in { data }', async () => {
    const state = { referralCode: 'ADMIN-XYZ' };
    service.getReferralStateForUser.mockResolvedValue(state);

    const result = await controller.getUserReferrals('user-42');

    expect(service.getReferralStateForUser).toHaveBeenCalledWith('user-42');
    expect(result).toEqual({ data: state });
  });

  it('markConverted forwards the referral id and wraps the service result', async () => {
    const serviceResult = { converted: true, referrerId: 'r1', milestone: 2 };
    service.markConvertedById.mockResolvedValue(serviceResult);

    const result = await controller.markConverted('ref-abc');

    expect(service.markConvertedById).toHaveBeenCalledWith('ref-abc');
    expect(result).toEqual({ data: serviceResult });
  });

  it('recomputeReferrer forwards the userId and wraps the service result', async () => {
    const serviceResult = { previousConvertedCount: 2, newConvertedCount: 3 };
    service.recomputeReferrerState.mockResolvedValue(serviceResult);

    const result = await controller.recomputeReferrer('user-77');

    expect(service.recomputeReferrerState).toHaveBeenCalledWith('user-77');
    expect(result).toEqual({ data: serviceResult });
  });
});
