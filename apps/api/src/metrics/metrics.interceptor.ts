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
        // request.route.path already contains the registered pattern (e.g. /tasks/:id).
        // Fallback to request.url only for unmatched requests (404s, OPTIONS); normalize
        // UUID/CUID segments to /:id to prevent Prometheus cardinality explosion.
        const rawRoute = (request.route?.path ?? request.url) as string;
        const route = rawRoute.replace(
          /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|\/[a-z0-9]{25,}/gi,
          '/:id',
        );
        this.metricsService.recordHttpRequest(
          request.method,
          route,
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
