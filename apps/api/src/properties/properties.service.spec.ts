import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { PropertiesRepository } from './properties.repository';
import { UserRole } from '@epde/shared';

const mockPropertiesRepository = {
  findProperties: jest.fn(),
  findWithPlan: jest.fn(),
  findById: jest.fn(),
  findOwnership: jest.fn(),
  createWithPlan: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
};

const adminUser = { id: 'admin-1', role: UserRole.ADMIN };
const clientUser = { id: 'client-1', role: UserRole.CLIENT };
const otherClient = { id: 'client-2', role: UserRole.CLIENT };

const mockProperty = {
  id: 'prop-1',
  userId: 'client-1',
  address: 'Av. Corrientes 1234',
  city: 'Buenos Aires',
  type: 'HOUSE',
  yearBuilt: 2010,
  squareMeters: 120,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

describe('PropertiesService', () => {
  let service: PropertiesService;
  let repository: typeof mockPropertiesRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PropertiesService,
        { provide: PropertiesRepository, useValue: mockPropertiesRepository },
      ],
    }).compile();

    service = module.get<PropertiesService>(PropertiesService);
    repository = module.get(PropertiesRepository);

    jest.clearAllMocks();
  });

  describe('listProperties', () => {
    const filters = {
      cursor: undefined,
      take: 20,
      search: undefined,
      userId: undefined,
      city: undefined,
      type: undefined,
    };

    it('should use currentUser.id as userId when role is CLIENT', async () => {
      const paginatedResult = { data: [mockProperty], nextCursor: null, hasMore: false, total: 1 };
      repository.findProperties.mockResolvedValue(paginatedResult);

      const result = await service.listProperties(filters, clientUser);

      expect(repository.findProperties).toHaveBeenCalledWith({
        cursor: undefined,
        take: 20,
        search: undefined,
        userId: 'client-1',
        city: undefined,
        type: undefined,
      });
      expect(result).toEqual(paginatedResult);
    });

    it('should use filters.userId when role is ADMIN', async () => {
      const filtersWithUser = { ...filters, userId: 'some-user' };
      const paginatedResult = { data: [], nextCursor: null, hasMore: false, total: 0 };
      repository.findProperties.mockResolvedValue(paginatedResult);

      await service.listProperties(filtersWithUser, adminUser);

      expect(repository.findProperties).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'some-user' }),
      );
    });

    it('should pass undefined userId for ADMIN when filters.userId is not set', async () => {
      repository.findProperties.mockResolvedValue({
        data: [],
        nextCursor: null,
        hasMore: false,
        total: 0,
      });

      await service.listProperties(filters, adminUser);

      expect(repository.findProperties).toHaveBeenCalledWith(
        expect.objectContaining({ userId: undefined }),
      );
    });
  });

  describe('getProperty', () => {
    it('should return property when found and user is ADMIN', async () => {
      repository.findWithPlan.mockResolvedValue(mockProperty);

      const result = await service.getProperty('prop-1', adminUser);

      expect(repository.findWithPlan).toHaveBeenCalledWith('prop-1');
      expect(result).toEqual(mockProperty);
    });

    it('should return property when CLIENT is the owner', async () => {
      repository.findWithPlan.mockResolvedValue(mockProperty);

      const result = await service.getProperty('prop-1', clientUser);

      expect(result).toEqual(mockProperty);
    });

    it('should throw NotFoundException when property not found', async () => {
      repository.findWithPlan.mockResolvedValue(null);

      await expect(service.getProperty('non-existent', clientUser)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getProperty('non-existent', clientUser)).rejects.toThrow(
        'Propiedad no encontrada',
      );
    });

    it('should throw ForbiddenException when CLIENT is not the owner', async () => {
      repository.findWithPlan.mockResolvedValue(mockProperty);

      await expect(service.getProperty('prop-1', otherClient)).rejects.toThrow(ForbiddenException);
      await expect(service.getProperty('prop-1', otherClient)).rejects.toThrow(
        'No tenés acceso a esta propiedad',
      );
    });
  });

  describe('createProperty', () => {
    it('should delegate to propertiesRepository.createWithPlan with correct data', async () => {
      const dto = {
        userId: 'client-1',
        address: 'Calle Nueva 456',
        city: 'Rosario',
        type: 'APARTMENT' as const,
        yearBuilt: 2020,
        squareMeters: 80,
      };
      const createdProperty = { ...mockProperty, ...dto, id: 'prop-new' };
      repository.createWithPlan.mockResolvedValue(createdProperty);

      const result = await service.createProperty(dto);

      expect(repository.createWithPlan).toHaveBeenCalledWith({
        userId: 'client-1',
        address: 'Calle Nueva 456',
        city: 'Rosario',
        type: 'APARTMENT',
        yearBuilt: 2020,
        squareMeters: 80,
      });
      expect(result).toEqual(createdProperty);
    });
  });

  describe('updateProperty', () => {
    const updateDto = { address: 'Calle Actualizada 789' };

    it('should update property when ADMIN', async () => {
      repository.findById.mockResolvedValue(mockProperty);
      repository.update.mockResolvedValue({ ...mockProperty, ...updateDto });

      const result = await service.updateProperty('prop-1', updateDto, adminUser);

      expect(repository.findById).toHaveBeenCalledWith('prop-1');
      expect(repository.update).toHaveBeenCalledWith('prop-1', {
        ...updateDto,
        updatedBy: 'admin-1',
      });
      expect(result.address).toBe('Calle Actualizada 789');
    });

    it('should update property when CLIENT is the owner', async () => {
      repository.findById.mockResolvedValue(mockProperty);
      repository.update.mockResolvedValue({ ...mockProperty, ...updateDto });

      const result = await service.updateProperty('prop-1', updateDto, clientUser);

      expect(repository.update).toHaveBeenCalledWith('prop-1', {
        ...updateDto,
        updatedBy: 'client-1',
      });
      expect(result.address).toBe('Calle Actualizada 789');
    });

    it('should throw NotFoundException when property not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.updateProperty('non-existent', updateDto, adminUser)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.updateProperty('non-existent', updateDto, adminUser)).rejects.toThrow(
        'Propiedad no encontrada',
      );
    });

    it('should throw ForbiddenException when CLIENT is not the owner', async () => {
      repository.findById.mockResolvedValue(mockProperty);

      await expect(service.updateProperty('prop-1', updateDto, otherClient)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.updateProperty('prop-1', updateDto, otherClient)).rejects.toThrow(
        'No tenés acceso a esta propiedad',
      );
    });
  });

  describe('deleteProperty', () => {
    it('should soft delete property when ADMIN', async () => {
      repository.findById.mockResolvedValue(mockProperty);
      repository.softDelete.mockResolvedValue(undefined);

      const result = await service.deleteProperty('prop-1', adminUser);

      expect(repository.findById).toHaveBeenCalledWith('prop-1');
      expect(repository.softDelete).toHaveBeenCalledWith('prop-1');
      expect(result).toEqual({ message: 'Propiedad eliminada' });
    });

    it('should soft delete property when CLIENT is the owner', async () => {
      repository.findById.mockResolvedValue(mockProperty);
      repository.softDelete.mockResolvedValue(undefined);

      const result = await service.deleteProperty('prop-1', clientUser);

      expect(repository.softDelete).toHaveBeenCalledWith('prop-1');
      expect(result).toEqual({ message: 'Propiedad eliminada' });
    });

    it('should throw NotFoundException when property not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.deleteProperty('non-existent', adminUser)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.deleteProperty('non-existent', adminUser)).rejects.toThrow(
        'Propiedad no encontrada',
      );
    });

    it('should throw ForbiddenException when CLIENT is not the owner', async () => {
      repository.findById.mockResolvedValue(mockProperty);

      await expect(service.deleteProperty('prop-1', otherClient)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.deleteProperty('prop-1', otherClient)).rejects.toThrow(
        'No tenés acceso a esta propiedad',
      );
    });
  });
});
