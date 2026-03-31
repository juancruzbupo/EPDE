import type { CurrentUser } from '@epde/shared';
import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { LandingSettingsRepository } from './landing-settings.repository';

export type LandingSettingsKey = 'pricing' | 'faq' | 'consequences' | 'general';

const VALID_KEYS: LandingSettingsKey[] = ['pricing', 'faq', 'consequences', 'general'];

@Injectable()
export class LandingSettingsService {
  private readonly logger = new Logger(LandingSettingsService.name);

  constructor(private readonly repository: LandingSettingsRepository) {}

  async getAll() {
    const settings = await this.repository.findAll();
    const map: Record<string, unknown> = {};
    for (const s of settings) {
      map[s.key] = s.value;
    }
    return map;
  }

  async getByKey(key: string) {
    if (!VALID_KEYS.includes(key as LandingSettingsKey)) {
      return null;
    }
    const setting = await this.repository.findByKey(key);
    return setting?.value ?? null;
  }

  async update(key: LandingSettingsKey, value: Prisma.InputJsonValue, user: CurrentUser) {
    this.logger.log(`Landing settings "${key}" updated by ${user.email}`);
    return this.repository.upsert(key, value, user.id);
  }
}
