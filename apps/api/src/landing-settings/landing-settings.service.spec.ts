import { Test, TestingModule } from '@nestjs/testing';

import { LandingSettingsRepository } from './landing-settings.repository';
import { LandingSettingsService } from './landing-settings.service';

describe('LandingSettingsService', () => {
  let service: LandingSettingsService;
  let repository: jest.Mocked<LandingSettingsRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LandingSettingsService,
        {
          provide: LandingSettingsRepository,
          useValue: {
            findAll: jest.fn(),
            findByKey: jest.fn(),
            upsert: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(LandingSettingsService);
    repository = module.get(LandingSettingsRepository);
  });

  describe('getAll', () => {
    it('returns all settings as key-value map', async () => {
      repository.findAll.mockResolvedValue([
        {
          id: '1',
          key: 'pricing',
          value: { price: '$35.000' },
          updatedAt: new Date(),
          updatedBy: null,
        },
        {
          id: '2',
          key: 'faq',
          value: [{ question: 'Q1', answer: 'A1' }],
          updatedAt: new Date(),
          updatedBy: null,
        },
      ]);

      const result = await service.getAll();

      expect(result).toEqual({
        pricing: { price: '$35.000' },
        faq: [{ question: 'Q1', answer: 'A1' }],
      });
    });

    it('returns empty object when no settings exist', async () => {
      repository.findAll.mockResolvedValue([]);
      const result = await service.getAll();
      expect(result).toEqual({});
    });
  });

  describe('getByKey', () => {
    it('returns value for valid key', async () => {
      repository.findByKey.mockResolvedValue({
        id: '1',
        key: 'pricing',
        value: { price: '$35.000' },
        updatedAt: new Date(),
        updatedBy: null,
      });

      const result = await service.getByKey('pricing');
      expect(result).toEqual({ price: '$35.000' });
    });

    it('returns null for invalid key', async () => {
      const result = await service.getByKey('invalid');
      expect(result).toBeNull();
      expect(repository.findByKey).not.toHaveBeenCalled();
    });

    it('returns null when key not found in DB', async () => {
      repository.findByKey.mockResolvedValue(null);
      const result = await service.getByKey('pricing');
      expect(result).toBeNull();
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

    it('upserts setting with correct key and value', async () => {
      const value = { price: '$45.000' };
      repository.upsert.mockResolvedValue({
        id: '1',
        key: 'pricing',
        value,
        updatedAt: new Date(),
        updatedBy: 'admin-1',
      });

      await service.update('pricing', value, mockUser);

      expect(repository.upsert).toHaveBeenCalledWith('pricing', value, 'admin-1');
    });

    it('accepts general key', async () => {
      const value = { phone: '5493435043696', socialProof: 'Test' };
      repository.upsert.mockResolvedValue({
        id: '1',
        key: 'general',
        value,
        updatedAt: new Date(),
        updatedBy: 'admin-1',
      });

      await service.update('general', value, mockUser);

      expect(repository.upsert).toHaveBeenCalledWith('general', value, 'admin-1');
    });
  });
});
