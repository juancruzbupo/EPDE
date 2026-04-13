import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

import { ServiceRequestCommentsService } from './service-request-comments.service';

const adminUser = { id: 'admin-1', role: 'ADMIN' };
const clientUser = { id: 'client-1', role: 'CLIENT' };

const openRequest = {
  id: 'sr-1',
  title: 'Pérdida de agua',
  status: 'OPEN',
  requestedBy: 'client-1',
  property: { userId: 'client-1' },
};

const resolvedRequest = { ...openRequest, status: 'RESOLVED' };

describe('ServiceRequestCommentsService', () => {
  let service: ServiceRequestCommentsService;
  let serviceRequestsRepository: { findByIdWithDetails: jest.Mock };
  let commentsRepository: { findByServiceRequestId: jest.Mock; createComment: jest.Mock };
  let notificationsHandler: { handleServiceCommentAdded: jest.Mock };

  const dto = { content: 'Cuándo pueden venir?' };

  beforeEach(() => {
    serviceRequestsRepository = {
      findByIdWithDetails: jest.fn().mockResolvedValue(openRequest),
    };
    commentsRepository = {
      findByServiceRequestId: jest.fn().mockResolvedValue([]),
      createComment: jest.fn().mockResolvedValue({ id: 'cmt-1', content: dto.content }),
    };
    notificationsHandler = {
      handleServiceCommentAdded: jest.fn().mockResolvedValue(undefined),
    };

    service = new ServiceRequestCommentsService(
      serviceRequestsRepository as never,
      commentsRepository as never,
      notificationsHandler as never,
    );
  });

  describe('getComments', () => {
    it('returns comments for an accessible service request', async () => {
      commentsRepository.findByServiceRequestId.mockResolvedValue([{ id: 'c-1' }]);
      const result = await service.getComments('sr-1', clientUser as never);
      expect(result).toEqual([{ id: 'c-1' }]);
    });

    it('throws NotFoundException when request does not exist', async () => {
      serviceRequestsRepository.findByIdWithDetails.mockResolvedValue(null);
      await expect(service.getComments('sr-1', clientUser as never)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when CLIENT does not own the request', async () => {
      const other = { id: 'other', role: 'CLIENT' };
      await expect(service.getComments('sr-1', other as never)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('addComment', () => {
    it('creates and returns the comment', async () => {
      const result = await service.addComment('sr-1', dto, clientUser as never);
      expect(result).toEqual({ id: 'cmt-1', content: dto.content });
      expect(commentsRepository.createComment).toHaveBeenCalledWith(
        'sr-1',
        'client-1',
        dto.content,
      );
    });

    it('throws NotFoundException when request does not exist', async () => {
      serviceRequestsRepository.findByIdWithDetails.mockResolvedValue(null);
      await expect(service.addComment('sr-1', dto, adminUser as never)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws BadRequestException for a terminal request (RESOLVED)', async () => {
      serviceRequestsRepository.findByIdWithDetails.mockResolvedValue(resolvedRequest);
      await expect(service.addComment('sr-1', dto, clientUser as never)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('fires notification as fire-and-forget after comment creation', async () => {
      await service.addComment('sr-1', dto, clientUser as never);
      expect(notificationsHandler.handleServiceCommentAdded).toHaveBeenCalledWith({
        serviceRequestId: 'sr-1',
        title: 'Pérdida de agua',
        commentAuthorId: 'client-1',
        requesterId: 'client-1',
      });
    });

    it('ADMIN can comment on any request regardless of ownership', async () => {
      const result = await service.addComment('sr-1', dto, adminUser as never);
      expect(result).toBeDefined();
    });
  });
});
