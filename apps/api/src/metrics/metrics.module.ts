import { Global, Module } from '@nestjs/common';

import { MetricsInterceptor } from './metrics.interceptor';
import { MetricsService } from './metrics.service';
import { MetricsCollectorService } from './metrics-collector.service';

@Global()
@Module({
  providers: [MetricsService, MetricsInterceptor, MetricsCollectorService],
  exports: [MetricsService, MetricsInterceptor],
})
export class MetricsModule {}
