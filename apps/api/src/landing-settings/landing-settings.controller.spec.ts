import { Test, TestingModule } from '@nestjs/testing';

import { LandingSettingsController } from './landing-settings.controller';
import { LandingSettingsService } from './landing-settings.service';

describe('LandingSettingsController', () => {
  let controller: LandingSettingsController;
  let service: jest.Mocked<LandingSettingsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LandingSettingsController],
      providers: [
        {
          provide: LandingSettingsService,
          useValue: {
            getAll: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(LandingSettingsController);
    service = module.get(LandingSettingsService);
  });

  describe('getAll', () => {
    it('returns all settings wrapped in data envelope', async () => {
      const mockSettings = { pricing: { price: '$35.000' }, faq: [] };
      service.getAll.mockResolvedValue(mockSettings);

      const result = await controller.getAll();

      expect(result).toEqual({ data: mockSettings });
    });
  });

  describe('update', () => {
    const mockUser = {
      id: 'admin-1',
      email: 'admin@epde.com',
      role: 'ADMIN' as const,
      jti: 'jwt-1',
      subscriptionExpiresAt: null,
    };

    it('updates setting and returns success message', async () => {
      const mockResult = {
        id: '1',
        key: 'pricing',
        value: { price: '$45.000' },
        updatedAt: new Date(),
        updatedBy: 'admin-1',
      };
      service.update.mockResolvedValue(mockResult);

      const result = await controller.update('pricing', { value: { price: '$45.000' } }, mockUser);

      expect(result).toEqual({ data: mockResult, message: 'Configuración actualizada' });
      expect(service.update).toHaveBeenCalledWith('pricing', { price: '$45.000' }, mockUser);
    });
  });
});
