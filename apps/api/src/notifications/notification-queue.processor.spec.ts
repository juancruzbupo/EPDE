import { Job } from 'bullmq';

import { NotificationQueueProcessor } from './notification-queue.processor';
import type { NotificationBatchJobData, NotificationJobData } from './notification-queue.types';

function makeJob(name: string, data: NotificationJobData | NotificationBatchJobData): Job {
  return { id: 'job-1', name, data } as unknown as Job;
}

describe('NotificationQueueProcessor', () => {
  let processor: NotificationQueueProcessor;
  let notificationsService: {
    createNotification: jest.Mock;
    createNotifications: jest.Mock;
  };

  beforeEach(() => {
    notificationsService = {
      createNotification: jest.fn().mockResolvedValue(undefined),
      createNotifications: jest.fn().mockResolvedValue(undefined),
    };
    processor = new NotificationQueueProcessor(notificationsService as never);
  });

  describe('process — job routing', () => {
    it('name=single → createNotification with the job data', async () => {
      const data: NotificationJobData = {
        userId: 'user-1',
        type: 'TASK_REMINDER',
        title: 'Tarea vencida',
        message: 'Limpieza de canaletas vence hoy',
      } as unknown as NotificationJobData;
      const job = makeJob('single', data);
      await processor.process(job);
      expect(notificationsService.createNotification).toHaveBeenCalledWith(data);
      expect(notificationsService.createNotifications).not.toHaveBeenCalled();
    });

    it('name=batch → createNotifications with the notifications array', async () => {
      const notifications = [
        { userId: 'u-1', type: 'TASK_REMINDER', title: 'T1', message: 'M1' },
        { userId: 'u-2', type: 'SYSTEM', title: 'T2', message: 'M2' },
      ] as unknown as NotificationJobData[];
      const data: NotificationBatchJobData = { notifications };
      const job = makeJob('batch', data);
      await processor.process(job);
      expect(notificationsService.createNotifications).toHaveBeenCalledWith(notifications);
      expect(notificationsService.createNotification).not.toHaveBeenCalled();
    });

    it('unknown name → falls through to createNotification', async () => {
      // any job name that is not 'batch' is treated as single
      const data = {
        userId: 'u-1',
        type: 'SYSTEM',
        title: 'T',
        message: 'M',
      } as unknown as NotificationJobData;
      const job = makeJob('other', data);
      await processor.process(job);
      expect(notificationsService.createNotification).toHaveBeenCalledWith(data);
    });
  });

  describe('error handling', () => {
    it('rethrows error so BullMQ marks job as failed and retries', async () => {
      notificationsService.createNotification.mockRejectedValue(new Error('DB unreachable'));
      const data = {
        userId: 'u-1',
        type: 'SYSTEM',
        title: 'T',
        message: 'M',
      } as unknown as NotificationJobData;
      const job = makeJob('single', data);
      await expect(processor.process(job)).rejects.toThrow('DB unreachable');
    });

    it('rethrows batch errors as well', async () => {
      notificationsService.createNotifications.mockRejectedValue(new Error('batch insert failed'));
      const job = makeJob('batch', { notifications: [] });
      await expect(processor.process(job)).rejects.toThrow('batch insert failed');
    });
  });
});
