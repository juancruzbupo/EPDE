import { UserRole } from '@epde/shared';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { MaintenancePlansRepository } from './maintenance-plans.repository';
import { MaintenancePlansService } from './maintenance-plans.service';

describe('MaintenancePlansService', () => {
  let service: MaintenancePlansService;
  let plansRepository: {
    findById: jest.Mock;
    findWithFullDetails: jest.Mock;
    findAll: jest.Mock;
    update: jest.Mock;
  };

  const clientUser = { id: 'client-1', role: UserRole.CLIENT };
  const adminUser = { id: 'admin-1', role: UserRole.ADMIN };

  beforeEach(async () => {
    plansRepository = {
      findById: jest.fn(),
      findWithFullDetails: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MaintenancePlansService,
        { provide: MaintenancePlansRepository, useValue: plansRepository },
      ],
    }).compile();

    service = module.get<MaintenancePlansService>(MaintenancePlansService);
  });

  describe('listPlans', () => {
    it('should return all plans for ADMIN (no userId filter)', async () => {
      const plans = [{ id: 'plan-1' }, { id: 'plan-2' }];
      plansRepository.findAll.mockResolvedValue(plans);

      const result = await service.listPlans(adminUser);

      expect(plansRepository.findAll).toHaveBeenCalledWith(undefined);
      expect(result).toEqual(plans);
    });

    it('should filter plans by userId for CLIENT', async () => {
      const plans = [{ id: 'plan-1' }];
      plansRepository.findAll.mockResolvedValue(plans);

      const result = await service.listPlans(clientUser);

      expect(plansRepository.findAll).toHaveBeenCalledWith(clientUser.id);
      expect(result).toEqual(plans);
    });
  });

  describe('getPlan', () => {
    it('should return plan for admin', async () => {
      const plan = {
        id: 'plan-1',
        propertyId: 'prop-1',
        property: { userId: 'someone-else' },
        tasks: [],
      };
      plansRepository.findWithFullDetails.mockResolvedValue(plan);

      const result = await service.getPlan('plan-1', adminUser);

      expect(result).toEqual(plan);
      expect(plansRepository.findWithFullDetails).toHaveBeenCalledWith('plan-1');
    });

    it('should return plan when client is the property owner', async () => {
      const plan = {
        id: 'plan-1',
        propertyId: 'prop-1',
        property: { userId: clientUser.id },
        tasks: [],
      };
      plansRepository.findWithFullDetails.mockResolvedValue(plan);

      const result = await service.getPlan('plan-1', clientUser);

      expect(result).toEqual(plan);
    });

    it('should throw NotFoundException when plan not found', async () => {
      plansRepository.findWithFullDetails.mockResolvedValue(null);

      await expect(service.getPlan('nonexistent', adminUser)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when client accesses another users plan', async () => {
      const plan = {
        id: 'plan-1',
        propertyId: 'prop-1',
        property: { userId: 'other-user' },
        tasks: [],
      };
      plansRepository.findWithFullDetails.mockResolvedValue(plan);

      await expect(service.getPlan('plan-1', clientUser)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updatePlan', () => {
    it('should update plan when found', async () => {
      const existingPlan = { id: 'plan-1', name: 'Plan original', status: 'ACTIVE' };
      const updatedPlan = { id: 'plan-1', name: 'Plan actualizado', status: 'ACTIVE' };
      plansRepository.findById.mockResolvedValue(existingPlan);
      plansRepository.update.mockResolvedValue(updatedPlan);

      const result = await service.updatePlan('plan-1', { name: 'Plan actualizado' }, 'admin-1');

      expect(result).toEqual(updatedPlan);
      expect(plansRepository.update).toHaveBeenCalledWith(
        'plan-1',
        expect.objectContaining({ name: 'Plan actualizado', updatedBy: 'admin-1' }),
      );
    });

    it('should throw NotFoundException when plan not found', async () => {
      plansRepository.findById.mockResolvedValue(null);

      await expect(service.updatePlan('nonexistent', {}, 'admin-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
