import { TaskNotesRepository } from './task-notes.repository';
import { PrismaService } from '../prisma/prisma.service';

describe('TaskNotesRepository', () => {
  let repository: TaskNotesRepository;
  let prisma: PrismaService;

  const mockModel = {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn().mockResolvedValue(0),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(() => {
    prisma = {
      taskNote: mockModel,
    } as unknown as PrismaService;

    repository = new TaskNotesRepository(prisma);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findByTaskId', () => {
    it('should filter by taskId and order by createdAt desc', async () => {
      mockModel.findMany.mockResolvedValue([]);

      await repository.findByTaskId('clx1tsk00000001');

      expect(mockModel.findMany).toHaveBeenCalledWith({
        where: { taskId: 'clx1tsk00000001' },
        include: { author: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should include author with id and name', async () => {
      mockModel.findMany.mockResolvedValue([]);

      await repository.findByTaskId('clx1tsk00000001');

      expect(mockModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: { author: { select: { id: true, name: true } } },
        }),
      );
    });

    it('should return empty array when no notes exist', async () => {
      mockModel.findMany.mockResolvedValue([]);

      const result = await repository.findByTaskId('clx1tsk00000001');

      expect(result).toEqual([]);
    });
  });

  describe('createForTask', () => {
    it('should create a note with taskId, authorId and content', async () => {
      const note = {
        id: 'clx1not00000001',
        taskId: 'clx1tsk00000001',
        authorId: 'clx1usr00000001',
        content: 'Se revisó el tablero eléctrico',
        author: { id: 'clx1usr00000001', name: 'Admin' },
      };
      mockModel.create.mockResolvedValue(note);

      await repository.createForTask(
        'clx1tsk00000001',
        'clx1usr00000001',
        'Se revisó el tablero eléctrico',
      );

      expect(mockModel.create).toHaveBeenCalledWith({
        data: {
          taskId: 'clx1tsk00000001',
          authorId: 'clx1usr00000001',
          content: 'Se revisó el tablero eléctrico',
        },
        include: { author: { select: { id: true, name: true } } },
      });
    });

    it('should include author in the created note response', async () => {
      const note = {
        id: 'clx1not00000001',
        taskId: 'clx1tsk00000001',
        authorId: 'clx1usr00000001',
        content: 'Nota de prueba',
        author: { id: 'clx1usr00000001', name: 'Admin' },
      };
      mockModel.create.mockResolvedValue(note);

      const result = await repository.createForTask(
        'clx1tsk00000001',
        'clx1usr00000001',
        'Nota de prueba',
      );

      expect(result).toEqual(
        expect.objectContaining({
          author: { id: 'clx1usr00000001', name: 'Admin' },
        }),
      );
    });
  });
});
