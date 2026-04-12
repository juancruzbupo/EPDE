import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { MetricsService } from './metrics.service';
import { MetricsCollectorService } from './metrics-collector.service';

const mockRedisService = {
  getMemoryInfo: jest.fn(),
};

const mockPrismaService = {
  $queryRaw: jest.fn(),
};

const mockMetricsService = {
  setRedisMemory: jest.fn(),
  setDbPoolConnections: jest.fn(),
};

describe('MetricsCollectorService', () => {
  let service: MetricsCollectorService;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MetricsCollectorService,
        { provide: RedisService, useValue: mockRedisService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: MetricsService, useValue: mockMetricsService },
      ],
    }).compile();

    service = module.get<MetricsCollectorService>(MetricsCollectorService);
  });

  afterEach(() => {
    service.onModuleDestroy();
    jest.useRealTimers();
  });

  it('should collect Redis memory on init', async () => {
    mockRedisService.getMemoryInfo.mockResolvedValue({
      usedMemoryBytes: 1_048_576,
      maxMemoryBytes: 536_870_912,
      usagePercentage: 0.195,
    });
    mockPrismaService.$queryRaw.mockResolvedValue([{ count: 5n }]);

    service.onModuleInit();
    // Initial collect is fire-and-forget — flush microtasks
    await Promise.resolve();
    await Promise.resolve();

    expect(mockMetricsService.setRedisMemory).toHaveBeenCalledWith(1_048_576, 0.195);
  });

  it('should collect DB pool connections on init', async () => {
    mockRedisService.getMemoryInfo.mockResolvedValue(null);
    mockPrismaService.$queryRaw.mockResolvedValue([{ count: 12n }]);

    service.onModuleInit();
    await Promise.resolve();
    await Promise.resolve();

    expect(mockMetricsService.setDbPoolConnections).toHaveBeenCalledWith(12);
  });

  it('should not throw when Redis getMemoryInfo returns null', async () => {
    mockRedisService.getMemoryInfo.mockResolvedValue(null);
    mockPrismaService.$queryRaw.mockResolvedValue([{ count: 0n }]);

    service.onModuleInit();
    await Promise.resolve();
    await Promise.resolve();

    expect(mockMetricsService.setRedisMemory).not.toHaveBeenCalled();
    expect(mockMetricsService.setDbPoolConnections).toHaveBeenCalledWith(0);
  });

  it('should not throw when DB query fails', async () => {
    mockRedisService.getMemoryInfo.mockResolvedValue(null);
    mockPrismaService.$queryRaw.mockRejectedValue(new Error('DB down'));

    service.onModuleInit();
    await Promise.resolve();
    await Promise.resolve();

    // Should not throw — graceful degradation
    expect(mockMetricsService.setDbPoolConnections).not.toHaveBeenCalled();
  });
});
