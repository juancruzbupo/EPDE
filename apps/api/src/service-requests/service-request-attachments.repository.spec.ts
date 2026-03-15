import { PrismaService } from '../prisma/prisma.service';
import { ServiceRequestAttachmentsRepository } from './service-request-attachments.repository';

describe('ServiceRequestAttachmentsRepository', () => {
  let repository: ServiceRequestAttachmentsRepository;
  let prisma: PrismaService;

  const mockAttachmentModel = {
    createMany: jest.fn(),
    findMany: jest.fn(),
  };

  beforeEach(() => {
    prisma = {
      serviceRequestAttachment: mockAttachmentModel,
    } as unknown as PrismaService;

    repository = new ServiceRequestAttachmentsRepository(prisma);
  });

  afterEach(() => jest.clearAllMocks());

  describe('addAttachments', () => {
    it('should create many attachments with mapped data', async () => {
      const attachments = [
        { url: 'https://r2.example.com/photo1.jpg', fileName: 'photo1.jpg' },
        { url: 'https://r2.example.com/photo2.jpg', fileName: 'photo2.jpg' },
      ];
      mockAttachmentModel.createMany.mockResolvedValue({ count: 2 });
      mockAttachmentModel.findMany.mockResolvedValue([]);

      await repository.addAttachments('clx1srv00000001', attachments);

      expect(mockAttachmentModel.createMany).toHaveBeenCalledWith({
        data: [
          {
            serviceRequestId: 'clx1srv00000001',
            url: 'https://r2.example.com/photo1.jpg',
            fileName: 'photo1.jpg',
          },
          {
            serviceRequestId: 'clx1srv00000001',
            url: 'https://r2.example.com/photo2.jpg',
            fileName: 'photo2.jpg',
          },
        ],
      });
    });

    it('should call findByServiceRequestId after creating attachments', async () => {
      const attachments = [{ url: 'https://r2.example.com/doc.pdf', fileName: 'doc.pdf' }];
      mockAttachmentModel.createMany.mockResolvedValue({ count: 1 });
      mockAttachmentModel.findMany.mockResolvedValue([
        {
          id: 'clx1att00000001',
          serviceRequestId: 'clx1srv00000001',
          url: 'https://r2.example.com/doc.pdf',
          fileName: 'doc.pdf',
        },
      ]);

      const result = await repository.addAttachments('clx1srv00000001', attachments);

      expect(mockAttachmentModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { serviceRequestId: 'clx1srv00000001' },
        }),
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('findByServiceRequestId', () => {
    it('should filter by serviceRequestId', async () => {
      mockAttachmentModel.findMany.mockResolvedValue([]);

      await repository.findByServiceRequestId('clx1srv00000001');

      expect(mockAttachmentModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { serviceRequestId: 'clx1srv00000001' },
        }),
      );
    });

    it('should order by createdAt desc', async () => {
      mockAttachmentModel.findMany.mockResolvedValue([]);

      await repository.findByServiceRequestId('clx1srv00000001');

      expect(mockAttachmentModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        }),
      );
    });

    it('should return empty array when no attachments exist', async () => {
      mockAttachmentModel.findMany.mockResolvedValue([]);

      const result = await repository.findByServiceRequestId('clx1srv00000001');

      expect(result).toEqual([]);
    });
  });
});
