import { LandingSettingsRepository } from './landing-settings.repository';

describe('LandingSettingsRepository', () => {
  let repository: LandingSettingsRepository;
  let prisma: {
    landingSettings: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      upsert: jest.Mock;
    };
  };

  const setting = { key: 'hero_title', value: 'Protegé tu hogar', updatedBy: 'admin-1' };

  beforeEach(() => {
    prisma = {
      landingSettings: {
        findUnique: jest.fn().mockResolvedValue(setting),
        findMany: jest.fn().mockResolvedValue([setting]),
        upsert: jest.fn().mockResolvedValue(setting),
      },
    };
    repository = new LandingSettingsRepository(prisma as never);
  });

  describe('findByKey', () => {
    it('returns the setting when it exists', async () => {
      const result = await repository.findByKey('hero_title');
      expect(result).toEqual(setting);
      expect(prisma.landingSettings.findUnique).toHaveBeenCalledWith({
        where: { key: 'hero_title' },
      });
    });

    it('returns null when the key does not exist', async () => {
      prisma.landingSettings.findUnique.mockResolvedValue(null);
      const result = await repository.findByKey('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('returns all settings ordered by key, capped at 50', async () => {
      await repository.findAll();
      expect(prisma.landingSettings.findMany).toHaveBeenCalledWith({
        orderBy: { key: 'asc' },
        take: 50,
      });
    });

    it('returns empty array when no settings exist', async () => {
      prisma.landingSettings.findMany.mockResolvedValue([]);
      const result = await repository.findAll();
      expect(result).toEqual([]);
    });
  });

  describe('upsert', () => {
    it('creates a setting when key does not exist', async () => {
      prisma.landingSettings.upsert.mockResolvedValue({
        key: 'new_key',
        value: 'new val',
        updatedBy: 'admin-1',
      });
      const result = await repository.upsert('new_key', 'new val', 'admin-1');
      expect(prisma.landingSettings.upsert).toHaveBeenCalledWith({
        where: { key: 'new_key' },
        update: { value: 'new val', updatedBy: 'admin-1' },
        create: { key: 'new_key', value: 'new val', updatedBy: 'admin-1' },
      });
      expect(result.key).toBe('new_key');
    });

    it('updates value and updatedBy when key already exists', async () => {
      const updated = { ...setting, value: 'Updated title', updatedBy: 'admin-2' };
      prisma.landingSettings.upsert.mockResolvedValue(updated);
      const result = await repository.upsert('hero_title', 'Updated title', 'admin-2');
      expect(result.value).toBe('Updated title');
      expect(result.updatedBy).toBe('admin-2');
    });
  });
});
