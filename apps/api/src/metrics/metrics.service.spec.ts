import { Test, TestingModule } from '@nestjs/testing';

import { MetricsService } from './metrics.service';

// Mocks must be defined inside factories (no outer variable refs — TDZ with jest.mock hoisting)
jest.mock('@opentelemetry/exporter-prometheus', () => ({
  PrometheusExporter: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('@opentelemetry/sdk-metrics', () => ({
  MeterProvider: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('@opentelemetry/api', () => ({
  metrics: {
    setGlobalMeterProvider: jest.fn(),
    getMeter: jest.fn().mockReturnValue({
      createCounter: jest.fn().mockReturnValue({ add: jest.fn() }),
      createHistogram: jest.fn().mockReturnValue({ record: jest.fn() }),
      createObservableGauge: jest.fn().mockReturnValue({ addCallback: jest.fn() }),
    }),
  },
}));

/* eslint-disable @typescript-eslint/no-explicit-any */
describe('MetricsService', () => {
  let service: MetricsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [MetricsService],
    }).compile();

    service = module.get<MetricsService>(MetricsService);
    service.onModuleInit();
  });

  describe('recordHttpRequest', () => {
    it('should increment counter and record histogram for an HTTP request', () => {
      const svc = service as any;
      const counterSpy = jest.spyOn(svc.httpRequestsTotal, 'add');
      const histogramSpy = jest.spyOn(svc.httpRequestDuration, 'record');

      service.recordHttpRequest('GET', '/api/v1/clients', 200, 45);

      expect(counterSpy).toHaveBeenCalledWith(1, {
        method: 'GET',
        route: '/api/v1/clients',
        status_code: 200,
      });
      expect(histogramSpy).toHaveBeenCalledWith(0.045, {
        method: 'GET',
        route: '/api/v1/clients',
      });
    });
  });

  describe('recordTokenRotation', () => {
    it('should increment token_rotation_total counter with result label', () => {
      const svc = service as any;
      const counterSpy = jest.spyOn(svc.tokenRotationTotal, 'add');

      service.recordTokenRotation('reuse_attack');

      expect(counterSpy).toHaveBeenCalledWith(1, { result: 'reuse_attack' });
    });
  });

  describe('recordCronExecution', () => {
    it('should record cron duration in seconds (ms to s conversion)', () => {
      const svc = service as any;
      const histogramSpy = jest.spyOn(svc.cronExecutionDuration, 'record');

      service.recordCronExecution('task-status', 2500);

      expect(histogramSpy).toHaveBeenCalledWith(2.5, { job: 'task-status' });
    });
  });

  describe('setRedisMemory', () => {
    it('should store Redis memory values for ObservableGauge callbacks', () => {
      const svc = service as any;
      service.setRedisMemory(1_048_576, 12.5);

      expect(svc._redisMemory).toEqual({ bytes: 1_048_576, percentage: 12.5 });
    });
  });

  describe('setDbPoolConnections', () => {
    it('should store DB pool active count for ObservableGauge callback', () => {
      const svc = service as any;
      service.setDbPoolConnections(15);

      expect(svc._dbPoolActive).toBe(15);
    });
  });
});
