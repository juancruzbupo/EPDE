import { type CurrentUser as CurrentUserPayload, UserRole } from '@epde/shared';
import { Test, TestingModule } from '@nestjs/testing';

import { PropertiesController } from './properties.controller';
import { PropertiesService } from './properties.service';

const mockPropertiesService = {
  listProperties: jest.fn(),
  getProperty: jest.fn(),
  createProperty: jest.fn(),
  updateProperty: jest.fn(),
  deleteProperty: jest.fn(),
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

const propertyId = 'property-uuid-1';

describe('PropertiesController', () => {
  let controller: PropertiesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PropertiesController],
      providers: [{ provide: PropertiesService, useValue: mockPropertiesService }],
    }).compile();

    controller = module.get<PropertiesController>(PropertiesController);
    jest.clearAllMocks();
  });

  describe('listProperties', () => {
    it('should delegate to propertiesService.listProperties and return service result directly', async () => {
      const filters = { cursor: undefined, take: 10 };
      const paginatedResult = { data: [], nextCursor: null };
      mockPropertiesService.listProperties.mockResolvedValue(paginatedResult);

      const result = await controller.listProperties(filters as any, clientUser);

      expect(mockPropertiesService.listProperties).toHaveBeenCalledWith(filters, clientUser);
      expect(result).toEqual(paginatedResult);
    });

    it('should pass admin user to service', async () => {
      const filters = { cursor: undefined, take: 20 };
      mockPropertiesService.listProperties.mockResolvedValue({ data: [], nextCursor: null });

      await controller.listProperties(filters as any, adminUser);

      expect(mockPropertiesService.listProperties).toHaveBeenCalledWith(filters, adminUser);
    });
  });

  describe('getProperty', () => {
    it('should call propertiesService.getProperty and return wrapped data', async () => {
      const property = { id: propertyId, address: 'Av. Corrientes 1234' };
      mockPropertiesService.getProperty.mockResolvedValue(property);

      const result = await controller.getProperty(propertyId, clientUser);

      expect(mockPropertiesService.getProperty).toHaveBeenCalledWith(propertyId, clientUser);
      expect(result).toEqual({ data: property });
    });

    it('should work for admin user too', async () => {
      const property = { id: propertyId, address: 'Av. Santa Fe 5678' };
      mockPropertiesService.getProperty.mockResolvedValue(property);

      const result = await controller.getProperty(propertyId, adminUser);

      expect(mockPropertiesService.getProperty).toHaveBeenCalledWith(propertyId, adminUser);
      expect(result).toEqual({ data: property });
    });
  });

  describe('createProperty', () => {
    it('should call propertiesService.createProperty with dto and user.id and return wrapped data with message', async () => {
      const dto = { address: 'Av. Corrientes 1234', type: 'HOUSE' };
      const createdProperty = { id: propertyId, ...dto };
      mockPropertiesService.createProperty.mockResolvedValue(createdProperty);

      const result = await controller.createProperty(dto as any, adminUser);

      expect(mockPropertiesService.createProperty).toHaveBeenCalledWith(dto, adminUser.id);
      expect(result).toEqual({ data: createdProperty, message: 'Propiedad creada' });
    });

    it('should extract user.id (not the whole user object) to pass to service', async () => {
      const dto = { address: 'Av. Libertador 999' };
      mockPropertiesService.createProperty.mockResolvedValue({ id: propertyId });

      await controller.createProperty(dto as any, adminUser);

      const [, passedUserId] = mockPropertiesService.createProperty.mock.calls[0];
      expect(passedUserId).toBe('admin-1');
    });
  });

  describe('updateProperty', () => {
    it('should call propertiesService.updateProperty with id, dto and full user and return wrapped data with message', async () => {
      const dto = { address: 'Av. Corrientes 5678' };
      const updatedProperty = { id: propertyId, address: 'Av. Corrientes 5678' };
      mockPropertiesService.updateProperty.mockResolvedValue(updatedProperty);

      const result = await controller.updateProperty(propertyId, dto as any, clientUser);

      expect(mockPropertiesService.updateProperty).toHaveBeenCalledWith(
        propertyId,
        dto,
        clientUser,
      );
      expect(result).toEqual({ data: updatedProperty, message: 'Propiedad actualizada' });
    });

    it('should pass the full user object so service can perform ownership checks', async () => {
      const dto = { address: 'Calle Nueva 123' };
      mockPropertiesService.updateProperty.mockResolvedValue({ id: propertyId });

      await controller.updateProperty(propertyId, dto as any, adminUser);

      const [, , passedUser] = mockPropertiesService.updateProperty.mock.calls[0];
      expect(passedUser).toEqual(adminUser);
    });
  });

  describe('deleteProperty', () => {
    it('should delegate to propertiesService.deleteProperty and return service result directly', async () => {
      const serviceResult = { data: null, message: 'Propiedad eliminada' };
      mockPropertiesService.deleteProperty.mockResolvedValue(serviceResult);

      const result = await controller.deleteProperty(propertyId, adminUser);

      expect(mockPropertiesService.deleteProperty).toHaveBeenCalledWith(propertyId, adminUser);
      expect(result).toEqual(serviceResult);
    });

    it('should pass the full user object to service', async () => {
      mockPropertiesService.deleteProperty.mockResolvedValue({
        data: null,
        message: 'Propiedad eliminada',
      });

      await controller.deleteProperty(propertyId, adminUser);

      const [, passedUser] = mockPropertiesService.deleteProperty.mock.calls[0];
      expect(passedUser).toEqual(adminUser);
    });
  });
});
