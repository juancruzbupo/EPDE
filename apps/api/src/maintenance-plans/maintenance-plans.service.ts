import type { ServiceUser, UpdatePlanInput } from '@epde/shared';
import { UserRole } from '@epde/shared';
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { PlanAccessDeniedError } from '../common/exceptions/domain.exceptions';
import { MaintenancePlansRepository } from './maintenance-plans.repository';

@Injectable()
export class MaintenancePlansService {
  constructor(private readonly plansRepository: MaintenancePlansRepository) {}

  async listPlans(currentUser?: ServiceUser) {
    const userId = currentUser?.role === UserRole.CLIENT ? currentUser.id : undefined;
    return this.plansRepository.findAll(userId);
  }

  async getPlan(id: string, currentUser?: ServiceUser) {
    const plan = await this.plansRepository.findWithFullDetails(id);
    if (!plan) {
      throw new NotFoundException('Plan de mantenimiento no encontrado');
    }

    try {
      if (currentUser?.role === UserRole.CLIENT && plan.property?.userId !== currentUser.id) {
        throw new PlanAccessDeniedError();
      }
    } catch (error) {
      if (error instanceof PlanAccessDeniedError) {
        throw new ForbiddenException(error.message);
      }
      throw error;
    }

    return plan;
  }

  async updatePlan(id: string, dto: UpdatePlanInput, updatedBy?: string) {
    const plan = await this.plansRepository.findById(id);
    if (!plan) {
      throw new NotFoundException('Plan de mantenimiento no encontrado');
    }
    return this.plansRepository.update(id, { ...dto, ...(updatedBy && { updatedBy }) });
  }
}
