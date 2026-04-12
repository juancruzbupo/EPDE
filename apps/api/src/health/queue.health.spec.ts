import { HealthCheckError } from '@nestjs/terminus';

import { QueueHealthIndicator } from './queue.health';

const mockEmailQueue = {
  getWaitingCount: jest.fn(),
};

const mockNotificationQueue = {
  getWaitingCount: jest.fn(),
};

describe('QueueHealthIndicator', () => {
  let indicator: QueueHealthIndicator;

  beforeEach(() => {
    jest.clearAllMocks();
    // Instantiate directly — HealthIndicator base class has no DI requirements
    indicator = new QueueHealthIndicator(mockEmailQueue as any, mockNotificationQueue as any);
  });

  it('should report healthy when backlog is below threshold', async () => {
    mockEmailQueue.getWaitingCount.mockResolvedValue(10);
    mockNotificationQueue.getWaitingCount.mockResolvedValue(5);

    const result = await indicator.isHealthy('queues');

    expect(result.queues!.status).toBe('up');
    expect(result.queues!.emailWaiting).toBe(10);
    expect(result.queues!.notifWaiting).toBe(5);
  });

  it('should report healthy when queues are empty', async () => {
    mockEmailQueue.getWaitingCount.mockResolvedValue(0);
    mockNotificationQueue.getWaitingCount.mockResolvedValue(0);

    const result = await indicator.isHealthy('queues');

    expect(result.queues!.status).toBe('up');
  });

  it('should throw HealthCheckError when backlog exceeds threshold', async () => {
    mockEmailQueue.getWaitingCount.mockResolvedValue(400);
    mockNotificationQueue.getWaitingCount.mockResolvedValue(200);

    await expect(indicator.isHealthy('queues')).rejects.toThrow(HealthCheckError);
  });

  it('should report unhealthy details in the error', async () => {
    mockEmailQueue.getWaitingCount.mockResolvedValue(300);
    mockNotificationQueue.getWaitingCount.mockResolvedValue(250);

    try {
      await indicator.isHealthy('queues');
      fail('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(HealthCheckError);
      const details = (error as HealthCheckError).causes;
      expect(details.queues.status).toBe('down');
      expect(details.queues.emailWaiting).toBe(300);
      expect(details.queues.notifWaiting).toBe(250);
    }
  });
});
