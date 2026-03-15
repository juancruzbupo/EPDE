import { HealthCheckService, PrismaHealthIndicator } from '@nestjs/terminus';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { HealthController } from './health.controller';
import { RedisHealthIndicator } from './redis.health';

const mockHealthCheckService = {
  check: jest.fn(),
};

const mockPrismaHealth = {
  pingCheck: jest.fn(),
};

const mockPrisma = {};

const mockRedisHealth = {
  isHealthy: jest.fn(),
};

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: HealthCheckService, useValue: mockHealthCheckService },
        { provide: PrismaHealthIndicator, useValue: mockPrismaHealth },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisHealthIndicator, useValue: mockRedisHealth },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    jest.clearAllMocks();
  });

  describe('check', () => {
    it('should delegate to health.check with an array of health indicator callbacks', () => {
      const healthResult = {
        status: 'ok',
        info: { database: { status: 'up' }, redis: { status: 'up' } },
      };
      mockHealthCheckService.check.mockResolvedValue(healthResult);

      controller.check();

      expect(mockHealthCheckService.check).toHaveBeenCalledTimes(1);
      const [indicators] = mockHealthCheckService.check.mock.calls[0];
      expect(indicators).toHaveLength(2);
      expect(typeof indicators[0]).toBe('function');
      expect(typeof indicators[1]).toBe('function');
    });

    it('should return health status from HealthCheckService', async () => {
      const healthResult = {
        status: 'ok',
        info: { database: { status: 'up' }, redis: { status: 'up' } },
      };
      mockHealthCheckService.check.mockResolvedValue(healthResult);

      const result = await controller.check();

      expect(result).toEqual(healthResult);
    });

    it('should pass prisma pingCheck callback as first indicator', async () => {
      const dbResult = { database: { status: 'up' } };
      mockPrismaHealth.pingCheck.mockResolvedValue(dbResult);
      mockHealthCheckService.check.mockImplementation(
        async (indicators: (() => Promise<unknown>)[]) => {
          await indicators[0]!();
          return { status: 'ok' };
        },
      );

      await controller.check();

      expect(mockPrismaHealth.pingCheck).toHaveBeenCalledWith('database', mockPrisma);
    });

    it('should pass redis isHealthy callback as second indicator', async () => {
      const redisResult = { redis: { status: 'up' } };
      mockRedisHealth.isHealthy.mockResolvedValue(redisResult);
      mockHealthCheckService.check.mockImplementation(
        async (indicators: (() => Promise<unknown>)[]) => {
          await indicators[1]!();
          return { status: 'ok' };
        },
      );

      await controller.check();

      expect(mockRedisHealth.isHealthy).toHaveBeenCalledWith('redis');
    });
  });
});
