import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

import { ServiceRequestAttachmentsService } from './service-request-attachments.service';

const adminUser = { id: 'admin-1', role: 'ADMIN' };
const clientUser = { id: 'client-1', role: 'CLIENT' };

const openRequest = {
  id: 'sr-1',
  title: 'Pérdida de agua',
  status: 'OPEN',
  requestedBy: 'client-1',
  property: { userId: 'client-1' },
};

const closedRequest = { ...openRequest, status: 'CLOSED' };

describe('ServiceRequestAttachmentsService', () => {
  let service: ServiceRequestAttachmentsService;
  let serviceRequestsRepository: { findByIdWithDetails: jest.Mock };
  let attachmentsRepository: { addAttachments: jest.Mock };

  const dto = { attachments: [{ url: 'https://s3.test/photo.jpg', fileName: 'photo.jpg' }] };

  beforeEach(() => {
    serviceRequestsRepository = {
      findByIdWithDetails: jest.fn().mockResolvedValue(openRequest),
    };
    attachmentsRepository = {
      addAttachments: jest.fn().mockResolvedValue([{ id: 'att-1' }]),
    };

    service = new ServiceRequestAttachmentsService(
      serviceRequestsRepository as never,
      attachmentsRepository as never,
    );
  });

  describe('addAttachments', () => {
    it('returns attachments for an open service request', async () => {
      const result = await service.addAttachments('sr-1', dto, adminUser as never);
      expect(result).toEqual([{ id: 'att-1' }]);
      expect(attachmentsRepository.addAttachments).toHaveBeenCalledWith('sr-1', dto.attachments);
    });

    it('throws NotFoundException when service request does not exist', async () => {
      serviceRequestsRepository.findByIdWithDetails.mockResolvedValue(null);
      await expect(service.addAttachments('sr-1', dto, adminUser as never)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws BadRequestException for a terminal service request (CLOSED)', async () => {
      serviceRequestsRepository.findByIdWithDetails.mockResolvedValue(closedRequest);
      await expect(service.addAttachments('sr-1', dto, clientUser as never)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws ForbiddenException when CLIENT does not own the request', async () => {
      const other = { id: 'other', role: 'CLIENT' };
      await expect(service.addAttachments('sr-1', dto, other as never)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('allows ADMIN to add attachments regardless of ownership', async () => {
      const result = await service.addAttachments('sr-1', dto, adminUser as never);
      expect(result).toBeDefined();
    });
  });
});
