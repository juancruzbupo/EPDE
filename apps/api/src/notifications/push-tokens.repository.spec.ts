import { PushTokensRepository } from './push-tokens.repository';

describe('PushTokensRepository', () => {
  let repository: PushTokensRepository;
  let prisma: {
    pushToken: {
      upsert: jest.Mock;
      delete: jest.Mock;
      deleteMany: jest.Mock;
      findMany: jest.Mock;
    };
  };

  const token = 'ExponentPushToken[abc123]';
  const userId = 'user-1';

  beforeEach(() => {
    prisma = {
      pushToken: {
        upsert: jest.fn().mockResolvedValue({ token, userId, platform: 'ios' }),
        delete: jest.fn().mockResolvedValue({ token }),
        deleteMany: jest.fn().mockResolvedValue({ count: 2 }),
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    repository = new PushTokensRepository(prisma as never);
  });

  describe('upsert', () => {
    it('creates a new token if it does not exist', async () => {
      const result = await repository.upsert(userId, token, 'ios');
      expect(prisma.pushToken.upsert).toHaveBeenCalledWith({
        where: { token },
        create: { userId, token, platform: 'ios' },
        update: { userId, platform: 'ios' },
      });
      expect(result.token).toBe(token);
    });

    it('updates userId and platform if token already exists (device reassignment)', async () => {
      await repository.upsert('new-user', token, 'android');
      expect(prisma.pushToken.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ update: { userId: 'new-user', platform: 'android' } }),
      );
    });
  });

  describe('remove', () => {
    it('deletes token and returns the record', async () => {
      const result = await repository.remove(token);
      expect(prisma.pushToken.delete).toHaveBeenCalledWith({ where: { token } });
      expect(result).toEqual({ token });
    });

    it('returns null and does not throw when token does not exist', async () => {
      prisma.pushToken.delete.mockRejectedValue(new Error('Record to delete does not exist'));
      const result = await repository.remove('nonexistent-token');
      expect(result).toBeNull();
    });
  });

  describe('removeAllForUser', () => {
    it('deletes all tokens for a user', async () => {
      const result = await repository.removeAllForUser(userId);
      expect(prisma.pushToken.deleteMany).toHaveBeenCalledWith({ where: { userId } });
      expect(result).toEqual({ count: 2 });
    });
  });

  describe('findByUserIds', () => {
    it('returns token+userId pairs for the given user ids', async () => {
      prisma.pushToken.findMany.mockResolvedValue([
        { token: 'tok-1', userId: 'u-1' },
        { token: 'tok-2', userId: 'u-2' },
      ]);
      const result = await repository.findByUserIds(['u-1', 'u-2']);
      expect(result).toHaveLength(2);
      expect(prisma.pushToken.findMany).toHaveBeenCalledWith({
        where: { userId: { in: ['u-1', 'u-2'] } },
        select: { token: true, userId: true },
        take: 50_000,
      });
    });

    it('returns empty array when no users have registered tokens', async () => {
      const result = await repository.findByUserIds(['u-99']);
      expect(result).toEqual([]);
    });
  });
});
