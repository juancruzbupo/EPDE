import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import * as Sentry from '@sentry/nestjs';

// OpenTelemetry — only active when OTEL endpoint is configured
if (process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
  const sdk = new NodeSDK({
    traceExporter: new OTLPTraceExporter({
      url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
    }),
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': { enabled: false },
      }),
    ],
  });
  sdk.start();
}

Sentry.init({
  dsn: process.env.SENTRY_DSN || '',
  environment: process.env.NODE_ENV || 'development',
  enabled: !!process.env.SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
  beforeSend(event) {
    // Redact sensitive headers
    if (event.request?.headers) {
      delete event.request.headers['authorization'];
      delete event.request.headers['cookie'];
    }
    // Redact sensitive body fields
    if (event.request?.data && typeof event.request.data === 'object') {
      const d = event.request.data as Record<string, unknown>;
      if ('password' in d) d.password = '[REDACTED]';
      if ('token' in d) d.token = '[REDACTED]';
      if ('refreshToken' in d) d.refreshToken = '[REDACTED]';
    }
    return event;
  },
});
