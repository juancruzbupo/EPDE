import { PrismaService } from '../prisma/prisma.service';
import { ServiceRequestCommentsRepository } from './service-request-comments.repository';

describe('ServiceRequestCommentsRepository', () => {
  let repository: ServiceRequestCommentsRepository;
  let prisma: PrismaService;

  const mockCommentModel = {
    create: jest.fn(),
    findMany: jest.fn(),
  };

  beforeEach(() => {
    prisma = {
      serviceRequestComment: mockCommentModel,
    } as unknown as PrismaService;

    repository = new ServiceRequestCommentsRepository(prisma);
  });

  afterEach(() => jest.clearAllMocks());

  describe('createComment', () => {
    it('should create a comment with correct data', async () => {
      mockCommentModel.create.mockResolvedValue({
        id: 'clx1cmt00000001',
        serviceRequestId: 'clx1srv00000001',
        userId: 'clx1usr00000001',
        content: 'Se necesita revisar la humedad',
      });

      await repository.createComment(
        'clx1srv00000001',
        'clx1usr00000001',
        'Se necesita revisar la humedad',
      );

      expect(mockCommentModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            serviceRequestId: 'clx1srv00000001',
            userId: 'clx1usr00000001',
            content: 'Se necesita revisar la humedad',
          },
        }),
      );
    });

    it('should include user with id and name in create response', async () => {
      mockCommentModel.create.mockResolvedValue({
        id: 'clx1cmt00000001',
        user: { id: 'clx1usr00000001', name: 'Admin' },
      });

      await repository.createComment('clx1srv00000001', 'clx1usr00000001', 'Comentario de prueba');

      expect(mockCommentModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            user: { select: { id: true, name: true } },
          },
        }),
      );
    });
  });

  describe('findByServiceRequestId', () => {
    it('should filter by serviceRequestId', async () => {
      mockCommentModel.findMany.mockResolvedValue([]);

      await repository.findByServiceRequestId('clx1srv00000001');

      expect(mockCommentModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { serviceRequestId: 'clx1srv00000001' },
        }),
      );
    });

    it('should order by createdAt asc', async () => {
      mockCommentModel.findMany.mockResolvedValue([]);

      await repository.findByServiceRequestId('clx1srv00000001');

      expect(mockCommentModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'asc' },
        }),
      );
    });

    it('should include user with id and name', async () => {
      mockCommentModel.findMany.mockResolvedValue([]);

      await repository.findByServiceRequestId('clx1srv00000001');

      expect(mockCommentModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            user: { select: { id: true, name: true } },
          },
        }),
      );
    });
  });
});
