import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { MaintenancePlansRepository } from './maintenance-plans.repository';
import type { UpdatePlanInput, ServiceUser } from '@epde/shared';
import { UserRole } from '@epde/shared';

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

    if (currentUser?.role === UserRole.CLIENT) {
      if (plan.property?.userId !== currentUser.id) {
        throw new ForbiddenException('No tenés acceso a este plan');
      }
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
