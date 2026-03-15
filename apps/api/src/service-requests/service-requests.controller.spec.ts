import { type CurrentUser as CurrentUserPayload, UserRole } from '@epde/shared';
import { Test, TestingModule } from '@nestjs/testing';

import { ServiceRequestsController } from './service-requests.controller';
import { ServiceRequestsService } from './service-requests.service';

const mockServiceRequestsService = {
  listRequests: jest.fn(),
  getRequest: jest.fn(),
  getAuditLog: jest.fn(),
  getComments: jest.fn(),
  createRequest: jest.fn(),
  addComment: jest.fn(),
  addAttachments: jest.fn(),
  editServiceRequest: jest.fn(),
  updateStatus: jest.fn(),
};

const adminUser: CurrentUserPayload = {
  id: 'admin-1',
  role: UserRole.ADMIN,
  email: 'admin@epde.ar',
  jti: 'jti-admin-1',
};

const clientUser: CurrentUserPayload = {
  id: 'client-1',
  role: UserRole.CLIENT,
  email: 'client@epde.ar',
  jti: 'jti-client-1',
};

const requestId = 'service-request-uuid-1';

describe('ServiceRequestsController', () => {
  let controller: ServiceRequestsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServiceRequestsController],
      providers: [{ provide: ServiceRequestsService, useValue: mockServiceRequestsService }],
    }).compile();

    controller = module.get<ServiceRequestsController>(ServiceRequestsController);
    jest.clearAllMocks();
  });

  describe('listRequests', () => {
    it('should delegate to service.listRequests and return service result directly', async () => {
      const filters = { cursor: undefined, take: 10, status: undefined };
      const paginatedResult = { data: [], nextCursor: null };
      mockServiceRequestsService.listRequests.mockResolvedValue(paginatedResult);

      const result = await controller.listRequests(filters as any, clientUser);

      expect(mockServiceRequestsService.listRequests).toHaveBeenCalledWith(filters, clientUser);
      expect(result).toEqual(paginatedResult);
    });

    it('should pass admin user to service', async () => {
      const filters = { cursor: undefined, take: 20 };
      mockServiceRequestsService.listRequests.mockResolvedValue({ data: [], nextCursor: null });

      await controller.listRequests(filters as any, adminUser);

      expect(mockServiceRequestsService.listRequests).toHaveBeenCalledWith(filters, adminUser);
    });
  });

  describe('getRequest', () => {
    it('should call service.getRequest and return wrapped data', async () => {
      const request = { id: requestId, title: 'Humedad en pared' };
      mockServiceRequestsService.getRequest.mockResolvedValue(request);

      const result = await controller.getRequest(requestId, clientUser);

      expect(mockServiceRequestsService.getRequest).toHaveBeenCalledWith(requestId, clientUser);
      expect(result).toEqual({ data: request });
    });

    it('should work for admin user too', async () => {
      const request = { id: requestId, title: 'Fisura en losa' };
      mockServiceRequestsService.getRequest.mockResolvedValue(request);

      const result = await controller.getRequest(requestId, adminUser);

      expect(mockServiceRequestsService.getRequest).toHaveBeenCalledWith(requestId, adminUser);
      expect(result).toEqual({ data: request });
    });
  });

  describe('getAuditLog', () => {
    it('should call service.getAuditLog and return wrapped data', async () => {
      const auditLog = [{ action: 'CREATED', timestamp: '2024-01-01' }];
      mockServiceRequestsService.getAuditLog.mockResolvedValue(auditLog);

      const result = await controller.getAuditLog(requestId, clientUser);

      expect(mockServiceRequestsService.getAuditLog).toHaveBeenCalledWith(requestId, clientUser);
      expect(result).toEqual({ data: auditLog });
    });
  });

  describe('getComments', () => {
    it('should call service.getComments and return wrapped data', async () => {
      const comments = [{ id: 'c-1', body: 'Revisado' }];
      mockServiceRequestsService.getComments.mockResolvedValue(comments);

      const result = await controller.getComments(requestId, clientUser);

      expect(mockServiceRequestsService.getComments).toHaveBeenCalledWith(requestId, clientUser);
      expect(result).toEqual({ data: comments });
    });
  });

  describe('createRequest', () => {
    it('should call service.createRequest with dto and user.id and return wrapped data with message', async () => {
      const dto = {
        propertyId: 'prop-1',
        title: 'Humedad en pared',
        description: 'Mancha creciente',
      };
      const created = { id: requestId, ...dto, status: 'PENDING' };
      mockServiceRequestsService.createRequest.mockResolvedValue(created);

      const result = await controller.createRequest(dto as any, clientUser);

      expect(mockServiceRequestsService.createRequest).toHaveBeenCalledWith(dto, clientUser.id);
      expect(result).toEqual({ data: created, message: 'Solicitud de servicio creada' });
    });

    it('should extract user.id (not the whole user object) to pass to service', async () => {
      const dto = { propertyId: 'prop-1', title: 'Grieta en muro' };
      mockServiceRequestsService.createRequest.mockResolvedValue({ id: requestId });

      await controller.createRequest(dto as any, clientUser);

      const [, passedUserId] = mockServiceRequestsService.createRequest.mock.calls[0];
      expect(passedUserId).toBe('client-1');
    });
  });

  describe('addComment', () => {
    it('should call service.addComment with id, dto and full user and return wrapped data with message', async () => {
      const dto = { body: 'Se necesita visita tecnica' };
      const comment = { id: 'comment-1', body: dto.body };
      mockServiceRequestsService.addComment.mockResolvedValue(comment);

      const result = await controller.addComment(requestId, dto as any, clientUser);

      expect(mockServiceRequestsService.addComment).toHaveBeenCalledWith(
        requestId,
        dto,
        clientUser,
      );
      expect(result).toEqual({ data: comment, message: 'Comentario agregado' });
    });

    it('should pass the full user object so service can record authorship', async () => {
      const dto = { body: 'Presupuesto adjunto' };
      mockServiceRequestsService.addComment.mockResolvedValue({ id: 'comment-2' });

      await controller.addComment(requestId, dto as any, adminUser);

      const [, , passedUser] = mockServiceRequestsService.addComment.mock.calls[0];
      expect(passedUser).toEqual(adminUser);
    });
  });

  describe('addAttachments', () => {
    it('should call service.addAttachments with id, dto and full user and return wrapped data with message', async () => {
      const dto = { attachments: [{ url: 'https://r2.example.com/photo.jpg', name: 'photo.jpg' }] };
      const attachments = [{ id: 'att-1', url: 'https://r2.example.com/photo.jpg' }];
      mockServiceRequestsService.addAttachments.mockResolvedValue(attachments);

      const result = await controller.addAttachments(requestId, dto as any, clientUser);

      expect(mockServiceRequestsService.addAttachments).toHaveBeenCalledWith(
        requestId,
        dto,
        clientUser,
      );
      expect(result).toEqual({ data: attachments, message: 'Adjuntos agregados' });
    });
  });

  describe('editRequest', () => {
    it('should call service.editServiceRequest with id, dto and full user and return wrapped data with message', async () => {
      const dto = { title: 'Humedad actualizada', description: 'Detalles nuevos' };
      const edited = { id: requestId, ...dto };
      mockServiceRequestsService.editServiceRequest.mockResolvedValue(edited);

      const result = await controller.editRequest(requestId, dto as any, clientUser);

      expect(mockServiceRequestsService.editServiceRequest).toHaveBeenCalledWith(
        requestId,
        dto,
        clientUser,
      );
      expect(result).toEqual({ data: edited, message: 'Solicitud actualizada' });
    });

    it('should pass the full user object so service can verify ownership', async () => {
      const dto = { title: 'Titulo corregido' };
      mockServiceRequestsService.editServiceRequest.mockResolvedValue({ id: requestId });

      await controller.editRequest(requestId, dto as any, clientUser);

      const [, , passedUser] = mockServiceRequestsService.editServiceRequest.mock.calls[0];
      expect(passedUser).toEqual(clientUser);
    });
  });

  describe('updateStatus', () => {
    it('should call service.updateStatus with id, dto and full user and return wrapped data with message', async () => {
      const dto = { status: 'IN_PROGRESS' };
      const updated = { id: requestId, status: 'IN_PROGRESS' };
      mockServiceRequestsService.updateStatus.mockResolvedValue(updated);

      const result = await controller.updateStatus(requestId, dto as any, adminUser);

      expect(mockServiceRequestsService.updateStatus).toHaveBeenCalledWith(
        requestId,
        dto,
        adminUser,
      );
      expect(result).toEqual({ data: updated, message: 'Estado de la solicitud actualizado' });
    });

    it('should propagate service result unchanged inside the data envelope', async () => {
      const dto = { status: 'COMPLETED' };
      const serviceResult = {
        id: requestId,
        status: 'COMPLETED',
        property: { address: 'Av. Rivadavia 100' },
      };
      mockServiceRequestsService.updateStatus.mockResolvedValue(serviceResult);

      const result = await controller.updateStatus(requestId, dto as any, adminUser);

      expect(result.data).toEqual(serviceResult);
    });
  });
});
