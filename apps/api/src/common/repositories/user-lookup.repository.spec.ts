import { PrismaService } from '../../prisma/prisma.service';
import { UserLookupRepository } from './user-lookup.repository';

describe('UserLookupRepository', () => {
  let repository: UserLookupRepository;
  let prisma: PrismaService;

  const mockUserModel = {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  };

  beforeEach(() => {
    prisma = {
      user: mockUserModel,
    } as unknown as PrismaService;

    repository = new UserLookupRepository(prisma);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAdminIds', () => {
    it('should filter by role ADMIN and deletedAt null with take 500', async () => {
      mockUserModel.findMany.mockResolvedValue([]);

      await repository.findAdminIds();

      expect(mockUserModel.findMany).toHaveBeenCalledWith({
        where: { role: 'ADMIN', deletedAt: null },
        select: { id: true },
        take: 500,
      });
    });

    it('should return array of id strings', async () => {
      mockUserModel.findMany.mockResolvedValue([
        { id: 'clx1adm00000001' },
        { id: 'clx1adm00000002' },
      ]);

      const result = await repository.findAdminIds();

      expect(result).toEqual(['clx1adm00000001', 'clx1adm00000002']);
    });

    it('should return empty array when no admins exist', async () => {
      mockUserModel.findMany.mockResolvedValue([]);

      const result = await repository.findAdminIds();

      expect(result).toEqual([]);
    });
  });

  describe('findEmailInfo', () => {
    it('should select only email and name fields', async () => {
      mockUserModel.findUnique.mockResolvedValue({
        email: 'admin@epde.com',
        name: 'Admin User',
      });

      await repository.findEmailInfo('clx1adm00000001');

      expect(mockUserModel.findUnique).toHaveBeenCalledWith({
        where: { id: 'clx1adm00000001' },
        select: { email: true, name: true },
      });
    });

    it('should return null when user not found', async () => {
      mockUserModel.findUnique.mockResolvedValue(null);

      const result = await repository.findEmailInfo('clx1missing0001');

      expect(result).toBeNull();
    });

    it('should return email and name projection', async () => {
      const info = { email: 'juan@example.com', name: 'Juan Pérez' };
      mockUserModel.findUnique.mockResolvedValue(info);

      const result = await repository.findEmailInfo('clx1user0000001');

      expect(result).toEqual({ email: 'juan@example.com', name: 'Juan Pérez' });
    });
  });
});
