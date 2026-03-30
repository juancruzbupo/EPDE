import { Module } from '@nestjs/common';

import { LandingSettingsController } from './landing-settings.controller';
import { LandingSettingsRepository } from './landing-settings.repository';
import { LandingSettingsService } from './landing-settings.service';

@Module({
  controllers: [LandingSettingsController],
  providers: [LandingSettingsRepository, LandingSettingsService],
  exports: [LandingSettingsService],
})
export class LandingSettingsModule {}
