import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ServiceRequestsService } from './service-requests.service';
import { ServiceRequestsRepository } from './service-requests.repository';
import { PropertiesRepository } from '../properties/properties.repository';
import { UserRole } from '@epde/shared';

const mockServiceRequestsRepository = {
  findRequests: jest.fn(),
  findByIdWithDetails: jest.fn(),
  createWithPhotos: jest.fn(),
  update: jest.fn(),
};

const mockPropertiesRepository = {
  findOwnership: jest.fn(),
};

const mockEventEmitter = {
  emit: jest.fn(),
};

const adminUser = { id: 'admin-1', role: UserRole.ADMIN };
const clientUser = { id: 'client-1', role: UserRole.CLIENT };
const otherClient = { id: 'client-2', role: UserRole.CLIENT };

const mockServiceRequest = {
  id: 'sr-1',
  propertyId: 'prop-1',
  requestedBy: 'client-1',
  title: 'Filtración en el techo',
  description: 'Se detectó una filtración en el techo del dormitorio principal',
  urgency: 'HIGH',
  status: 'OPEN',
  createdAt: new Date(),
  updatedAt: new Date(),
  property: {
    id: 'prop-1',
    address: 'Av. Corrientes 1234',
    city: 'Buenos Aires',
    userId: 'client-1',
    user: { id: 'client-1', name: 'Juan Pérez' },
  },
  requester: { id: 'client-1', name: 'Juan Pérez', email: 'juan@example.com' },
  photos: [],
};

describe('ServiceRequestsService', () => {
  let service: ServiceRequestsService;
  let serviceRequestsRepo: typeof mockServiceRequestsRepository;
  let propertiesRepo: typeof mockPropertiesRepository;
  let eventEmitter: typeof mockEventEmitter;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceRequestsService,
        { provide: ServiceRequestsRepository, useValue: mockServiceRequestsRepository },
        { provide: PropertiesRepository, useValue: mockPropertiesRepository },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<ServiceRequestsService>(ServiceRequestsService);
    serviceRequestsRepo = module.get(ServiceRequestsRepository);
    propertiesRepo = module.get(PropertiesRepository);
    eventEmitter = module.get(EventEmitter2);

    jest.clearAllMocks();
  });

  describe('listRequests', () => {
    const filters = {
      cursor: undefined,
      take: 20,
      status: undefined,
      urgency: undefined,
      propertyId: undefined,
    };

    it('should pass currentUser.id as userId when role is CLIENT', async () => {
      const paginatedResult = {
        data: [mockServiceRequest],
        nextCursor: null,
        hasMore: false,
        total: 1,
      };
      serviceRequestsRepo.findRequests.mockResolvedValue(paginatedResult);

      const result = await service.listRequests(filters, clientUser);

      expect(serviceRequestsRepo.findRequests).toHaveBeenCalledWith({
        cursor: undefined,
        take: 20,
        status: undefined,
        urgency: undefined,
        propertyId: undefined,
        userId: 'client-1',
      });
      expect(result).toEqual(paginatedResult);
    });

    it('should pass userId as undefined when role is ADMIN', async () => {
      const paginatedResult = { data: [], nextCursor: null, hasMore: false, total: 0 };
      serviceRequestsRepo.findRequests.mockResolvedValue(paginatedResult);

      await service.listRequests(filters, adminUser);

      expect(serviceRequestsRepo.findRequests).toHaveBeenCalledWith(
        expect.objectContaining({ userId: undefined }),
      );
    });

    it('should forward filter params (status, urgency, propertyId)', async () => {
      const filtersWithParams = {
        ...filters,
        status: 'OPEN' as const,
        urgency: 'HIGH' as const,
        propertyId: 'prop-1',
      };
      serviceRequestsRepo.findRequests.mockResolvedValue({
        data: [],
        nextCursor: null,
        hasMore: false,
        total: 0,
      });

      await service.listRequests(filtersWithParams, adminUser);

      expect(serviceRequestsRepo.findRequests).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'OPEN',
          urgency: 'HIGH',
          propertyId: 'prop-1',
        }),
      );
    });
  });

  describe('getRequest', () => {
    it('should return the service request when found and user is ADMIN', async () => {
      serviceRequestsRepo.findByIdWithDetails.mockResolvedValue(mockServiceRequest);

      const result = await service.getRequest('sr-1', adminUser);

      expect(serviceRequestsRepo.findByIdWithDetails).toHaveBeenCalledWith('sr-1');
      expect(result).toEqual(mockServiceRequest);
    });

    it('should return the service request when CLIENT is the property owner', async () => {
      serviceRequestsRepo.findByIdWithDetails.mockResolvedValue(mockServiceRequest);

      const result = await service.getRequest('sr-1', clientUser);

      expect(result).toEqual(mockServiceRequest);
    });

    it('should throw NotFoundException when service request not found', async () => {
      serviceRequestsRepo.findByIdWithDetails.mockResolvedValue(null);

      await expect(service.getRequest('non-existent', clientUser)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getRequest('non-existent', clientUser)).rejects.toThrow(
        'Solicitud de servicio no encontrada',
      );
    });

    it('should throw ForbiddenException when CLIENT is not the property owner', async () => {
      serviceRequestsRepo.findByIdWithDetails.mockResolvedValue(mockServiceRequest);

      await expect(service.getRequest('sr-1', otherClient)).rejects.toThrow(ForbiddenException);
      await expect(service.getRequest('sr-1', otherClient)).rejects.toThrow(
        'No tenés acceso a esta solicitud',
      );
    });
  });

  describe('createRequest', () => {
    const createDto = {
      propertyId: 'prop-1',
      title: 'Humedad en pared',
      description: 'Se detectó humedad en la pared del living',
      urgency: 'MEDIUM' as const,
      photoUrls: ['https://example.com/photo1.jpg'],
    };

    it('should create a service request and emit event', async () => {
      propertiesRepo.findOwnership.mockResolvedValue({ id: 'prop-1', userId: 'client-1' });
      const createdRequest = { ...mockServiceRequest, id: 'sr-new', title: createDto.title };
      serviceRequestsRepo.createWithPhotos.mockResolvedValue(createdRequest);

      const result = await service.createRequest(createDto, 'client-1');

      expect(propertiesRepo.findOwnership).toHaveBeenCalledWith('prop-1');
      expect(serviceRequestsRepo.createWithPhotos).toHaveBeenCalledWith({
        propertyId: 'prop-1',
        requestedBy: 'client-1',
        createdBy: 'client-1',
        title: 'Humedad en pared',
        description: 'Se detectó humedad en la pared del living',
        urgency: 'MEDIUM',
        photoUrls: ['https://example.com/photo1.jpg'],
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith('service.created', {
        serviceRequestId: 'sr-new',
        title: 'Humedad en pared',
        requesterId: 'client-1',
        urgency: 'MEDIUM',
      });
      expect(result).toEqual(createdRequest);
    });

    it('should default urgency to MEDIUM when not provided', async () => {
      propertiesRepo.findOwnership.mockResolvedValue({ id: 'prop-1', userId: 'client-1' });
      const dtoWithoutUrgency = { ...createDto, urgency: undefined };
      serviceRequestsRepo.createWithPhotos.mockResolvedValue({
        ...mockServiceRequest,
        id: 'sr-new2',
      });

      await service.createRequest(dtoWithoutUrgency as any, 'client-1');

      expect(serviceRequestsRepo.createWithPhotos).toHaveBeenCalledWith(
        expect.objectContaining({ urgency: 'MEDIUM' }),
      );
    });

    it('should throw NotFoundException when property not found', async () => {
      propertiesRepo.findOwnership.mockResolvedValue(null);

      await expect(service.createRequest(createDto, 'client-1')).rejects.toThrow(NotFoundException);
      await expect(service.createRequest(createDto, 'client-1')).rejects.toThrow(
        'Propiedad no encontrada',
      );
    });

    it('should throw ForbiddenException when user does not own the property', async () => {
      propertiesRepo.findOwnership.mockResolvedValue({ id: 'prop-1', userId: 'client-1' });

      await expect(service.createRequest(createDto, 'client-2')).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.createRequest(createDto, 'client-2')).rejects.toThrow(
        'No tenés acceso a esta propiedad',
      );
    });

    it('should not emit event when property is not found', async () => {
      propertiesRepo.findOwnership.mockResolvedValue(null);

      await expect(service.createRequest(createDto, 'client-1')).rejects.toThrow(NotFoundException);

      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });
  });

  describe('updateStatus', () => {
    const updateDto = { status: 'IN_PROGRESS' as const };
    const adminUser = { id: 'admin-1', role: 'ADMIN' };

    it('should update status and emit statusChanged event', async () => {
      serviceRequestsRepo.findByIdWithDetails.mockResolvedValue(mockServiceRequest);
      const updatedRequest = { ...mockServiceRequest, status: 'IN_PROGRESS' };
      serviceRequestsRepo.update.mockResolvedValue(updatedRequest);

      const result = await service.updateStatus('sr-1', updateDto, adminUser);

      expect(serviceRequestsRepo.findByIdWithDetails).toHaveBeenCalledWith('sr-1');
      expect(serviceRequestsRepo.update).toHaveBeenCalledWith(
        'sr-1',
        { status: 'IN_PROGRESS', updatedBy: 'admin-1' },
        {
          property: {
            select: {
              id: true,
              address: true,
              city: true,
              user: { select: { id: true, name: true } },
            },
          },
          requester: { select: { id: true, name: true } },
          photos: true,
        },
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith('service.statusChanged', {
        serviceRequestId: 'sr-1',
        title: 'Filtración en el techo',
        oldStatus: 'OPEN',
        newStatus: 'IN_PROGRESS',
        requesterId: 'client-1',
      });
      expect(result).toEqual(updatedRequest);
    });

    it('should throw NotFoundException when service request not found', async () => {
      serviceRequestsRepo.findByIdWithDetails.mockResolvedValue(null);

      await expect(service.updateStatus('non-existent', updateDto, adminUser)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.updateStatus('non-existent', updateDto, adminUser)).rejects.toThrow(
        'Solicitud de servicio no encontrada',
      );
    });

    it('should not call update or emit event when request not found', async () => {
      serviceRequestsRepo.findByIdWithDetails.mockResolvedValue(null);

      await expect(service.updateStatus('non-existent', updateDto, adminUser)).rejects.toThrow(
        NotFoundException,
      );

      expect(serviceRequestsRepo.update).not.toHaveBeenCalled();
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });
  });
});
