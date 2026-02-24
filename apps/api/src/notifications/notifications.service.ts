import { Injectable } from '@nestjs/common';
import { NotificationsRepository } from './notifications.repository';

@Injectable()
export class NotificationsService {
  constructor(private readonly notificationsRepository: NotificationsRepository) {}

  async getNotifications(userId: string, cursor?: string, take?: number) {
    return this.notificationsRepository.findByUser(userId, cursor, take);
  }

  async getUnreadCount(userId: string) {
    return this.notificationsRepository.countUnread(userId);
  }

  async markAsRead(id: string, userId: string) {
    return this.notificationsRepository.markAsRead(id, userId);
  }

  async markAllAsRead(userId: string) {
    return this.notificationsRepository.markAllAsRead(userId);
  }

  async createNotification(data: {
    userId: string;
    type: 'TASK_REMINDER' | 'BUDGET_UPDATE' | 'SERVICE_UPDATE' | 'SYSTEM';
    title: string;
    message: string;
    data?: Record<string, unknown>;
  }) {
    return this.notificationsRepository.create({
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      data: data.data ?? null,
    });
  }
}
