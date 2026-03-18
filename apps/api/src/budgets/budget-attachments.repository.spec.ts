import { PrismaService } from '../prisma/prisma.service';
import { BudgetAttachmentsRepository } from './budget-attachments.repository';

describe('BudgetAttachmentsRepository', () => {
  let repository: BudgetAttachmentsRepository;
  let prisma: PrismaService;

  const mockAttachmentModel = {
    createMany: jest.fn(),
    findMany: jest.fn(),
  };

  beforeEach(() => {
    prisma = {
      budgetAttachment: mockAttachmentModel,
    } as unknown as PrismaService;

    repository = new BudgetAttachmentsRepository(prisma);
  });

  afterEach(() => jest.clearAllMocks());

  describe('addAttachments', () => {
    it('should create many attachments with mapped data', async () => {
      const attachments = [
        { url: 'https://r2.example.com/presupuesto1.pdf', fileName: 'presupuesto1.pdf' },
        { url: 'https://r2.example.com/presupuesto2.pdf', fileName: 'presupuesto2.pdf' },
      ];
      mockAttachmentModel.createMany.mockResolvedValue({ count: 2 });
      mockAttachmentModel.findMany.mockResolvedValue([]);

      await repository.addAttachments('clx1bdg00000001', attachments);

      expect(mockAttachmentModel.createMany).toHaveBeenCalledWith({
        data: [
          {
            budgetId: 'clx1bdg00000001',
            url: 'https://r2.example.com/presupuesto1.pdf',
            fileName: 'presupuesto1.pdf',
          },
          {
            budgetId: 'clx1bdg00000001',
            url: 'https://r2.example.com/presupuesto2.pdf',
            fileName: 'presupuesto2.pdf',
          },
        ],
      });
    });

    it('should call findByBudgetId after creating attachments', async () => {
      const attachments = [{ url: 'https://r2.example.com/factura.pdf', fileName: 'factura.pdf' }];
      mockAttachmentModel.createMany.mockResolvedValue({ count: 1 });
      mockAttachmentModel.findMany.mockResolvedValue([
        {
          id: 'clx1att00000001',
          budgetId: 'clx1bdg00000001',
          url: 'https://r2.example.com/factura.pdf',
          fileName: 'factura.pdf',
        },
      ]);

      const result = await repository.addAttachments('clx1bdg00000001', attachments);

      expect(mockAttachmentModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { budgetId: 'clx1bdg00000001' },
        }),
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('findByBudgetId', () => {
    it('should filter by budgetId', async () => {
      mockAttachmentModel.findMany.mockResolvedValue([]);

      await repository.findByBudgetId('clx1bdg00000001');

      expect(mockAttachmentModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { budgetId: 'clx1bdg00000001' },
        }),
      );
    });

    it('should order by createdAt desc (newest first)', async () => {
      mockAttachmentModel.findMany.mockResolvedValue([]);

      await repository.findByBudgetId('clx1bdg00000001');

      expect(mockAttachmentModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        }),
      );
    });

    it('should return empty array when no attachments exist', async () => {
      mockAttachmentModel.findMany.mockResolvedValue([]);

      const result = await repository.findByBudgetId('clx1bdg00000001');

      expect(result).toEqual([]);
    });
  });
});
