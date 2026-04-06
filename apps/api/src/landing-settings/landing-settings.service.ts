import type { CurrentUser } from '@epde/shared';
import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { RedisService } from '../redis/redis.service';
import { LandingSettingsRepository } from './landing-settings.repository';

export type LandingSettingsKey = 'pricing' | 'faq' | 'consequences' | 'general';

const VALID_KEYS: LandingSettingsKey[] = ['pricing', 'faq', 'consequences', 'general'];
const CACHE_KEY = 'landing-settings:all';
const CACHE_TTL = 3600; // 1 hour

@Injectable()
export class LandingSettingsService {
  private readonly logger = new Logger(LandingSettingsService.name);

  constructor(
    private readonly repository: LandingSettingsRepository,
    private readonly redis: RedisService,
  ) {}

  async getAll() {
    try {
      const cached = await this.redis.get(CACHE_KEY);
      if (cached) return JSON.parse(cached);
    } catch {
      /* Redis unavailable */
    }

    const settings = await this.repository.findAll();
    const map: Record<string, unknown> = {};
    for (const s of settings) {
      map[s.key] = s.value;
    }

    try {
      await this.redis.setex(CACHE_KEY, CACHE_TTL, JSON.stringify(map));
    } catch {
      /* Redis unavailable */
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
    const result = await this.repository.upsert(key, value, user.id);
    try {
      await this.redis.del(CACHE_KEY);
    } catch {
      /* Redis unavailable */
    }
    return result;
  }
}
