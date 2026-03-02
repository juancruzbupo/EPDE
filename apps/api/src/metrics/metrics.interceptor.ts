import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { MetricsService } from './metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const start = Date.now();

    const recordMetric = (statusCode: number) => {
      try {
        const durationMs = Date.now() - start;
        this.metricsService.recordHttpRequest(
          request.method,
          request.route?.path ?? request.url,
          statusCode,
          durationMs,
        );
      } catch {
        // Metrics failure must never interrupt the response
      }
    };

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          recordMetric(response.statusCode);
        },
        error: (err: { status?: number }) => {
          recordMetric(err?.status ?? 500);
        },
      }),
    );
  }
}
