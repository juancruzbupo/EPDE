import { Injectable, OnModuleInit } from '@nestjs/common';
import { MeterProvider } from '@opentelemetry/sdk-metrics';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { metrics } from '@opentelemetry/api';
import type { Counter, Histogram } from '@opentelemetry/api';

@Injectable()
export class MetricsService implements OnModuleInit {
  private httpRequestsTotal!: Counter;
  private httpRequestDuration!: Histogram;
  private tokenRotationTotal!: Counter;
  private cronExecutionDuration!: Histogram;

  onModuleInit() {
    const exporter = new PrometheusExporter({ port: 9464 });
    const meterProvider = new MeterProvider({
      readers: [exporter],
    });
    metrics.setGlobalMeterProvider(meterProvider);

    const meter = metrics.getMeter('epde-api');

    this.httpRequestsTotal = meter.createCounter('http_requests_total', {
      description: 'Total HTTP requests',
    });

    this.httpRequestDuration = meter.createHistogram('http_request_duration_seconds', {
      description: 'HTTP request duration in seconds',
    });

    this.tokenRotationTotal = meter.createCounter('token_rotation_total', {
      description: 'Total token rotation attempts',
    });

    this.cronExecutionDuration = meter.createHistogram('cron_execution_duration_seconds', {
      description: 'Cron job execution duration in seconds',
    });
  }

  recordHttpRequest(method: string, route: string, statusCode: number, durationMs: number) {
    this.httpRequestsTotal.add(1, { method, route, status_code: statusCode });
    this.httpRequestDuration.record(durationMs / 1000, { method, route });
  }

  recordTokenRotation(result: 'success' | 'expired' | 'reuse_attack') {
    this.tokenRotationTotal.add(1, { result });
  }

  recordCronExecution(jobName: string, durationMs: number) {
    this.cronExecutionDuration.record(durationMs / 1000, { job: jobName });
  }
}
