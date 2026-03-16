import { Injectable, Logger } from '@nestjs/common';

import { PushTokensRepository } from './push-tokens.repository';

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  sound?: 'default';
}

/**
 * Sends push notifications via the Expo Push API.
 * Fire-and-forget — errors are logged but never thrown.
 */
@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  constructor(private readonly pushTokensRepository: PushTokensRepository) {}

  /** Register a device push token for a user. */
  async registerToken(userId: string, token: string, platform: string) {
    return this.pushTokensRepository.upsert(userId, token, platform);
  }

  /** Remove a specific push token (e.g., on logout). */
  async removeToken(token: string) {
    return this.pushTokensRepository.remove(token);
  }

  /** Remove all push tokens for a user (e.g., on account deletion). */
  async removeAllForUser(userId: string) {
    return this.pushTokensRepository.removeAllForUser(userId);
  }

  /** Send push notification to specific users (fire-and-forget). */
  async sendToUsers(
    userIds: string[],
    notification: { title: string; body: string; data?: Record<string, string> },
  ) {
    try {
      const tokens = await this.pushTokensRepository.findByUserIds(userIds);
      if (tokens.length === 0) return;

      const messages: ExpoPushMessage[] = tokens.map((t) => ({
        to: t.token,
        title: notification.title,
        body: notification.body,
        data: notification.data,
        sound: 'default' as const,
      }));

      // Expo Push API accepts batches of up to 100 messages
      const chunks = this.chunkArray(messages, 100);
      for (const chunk of chunks) {
        await this.sendChunk(chunk);
      }
    } catch (error) {
      this.logger.error(`Failed to send push notifications: ${error}`);
    }
  }

  private async sendChunk(messages: ExpoPushMessage[]) {
    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(messages),
      });

      if (!response.ok) {
        this.logger.warn(`Expo Push API returned ${response.status}`);
      }
    } catch (error) {
      this.logger.error(`Expo Push API request failed: ${error}`);
    }
  }

  private chunkArray<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  }
}
