import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as Sentry from '@sentry/node';

import { UserLookupRepository } from '../common/repositories/user-lookup.repository';
import { NotificationsService } from '../notifications/notifications.service';
import { ProfessionalSubRepository } from '../professionals/professional-sub.repository';
import { ProfessionalsRepository } from '../professionals/professionals.repository';
import { DistributedLockService } from '../redis/distributed-lock.service';

/**
 * Matrícula & seguro RC expiry cron. Runs daily at 08:00 Argentina (11:00 UTC).
 *
 * Behavior:
 * 1. Finds MATRICULA and SEGURO_RC attachments expiring in ≤30 days.
 * 2. Sends one notification per admin for each upcoming expiry (dedup by date window).
 * 3. If an attachment is already expired AND the professional is still
 *    AVAILABLE, flips availability to UNAVAILABLE and sends a high-priority
 *    notification so the admin stops assigning new SRs to them.
 *
 * Deliberately does not hard-block assignments at runtime — admin retains
 * full control to assign even with expired matrícula under exceptional
 * circumstances (the UI surfaces the warning prominently).
 */
@Injectable()
export class MatriculaExpiryService {
  private readonly logger = new Logger(MatriculaExpiryService.name);

  constructor(
    private readonly professionals: ProfessionalsRepository,
    private readonly subRepo: ProfessionalSubRepository,
    private readonly userLookup: UserLookupRepository,
    private readonly notifications: NotificationsService,
    private readonly lockService: DistributedLockService,
  ) {}

  @Cron('0 11 * * *', { name: 'matricula-expiry' })
  async checkExpiringMatriculas(): Promise<void> {
    const lockKey = 'cron:matricula-expiry';
    const owner = await this.lockService.acquireLock(lockKey, 300);
    if (!owner) {
      this.logger.log('Lock not acquired — another instance is running matricula-expiry');
      return;
    }

    try {
      const attachments = await this.subRepo.findExpiringAttachments(
        ['MATRICULA', 'SEGURO_RC'],
        30,
      );
      if (attachments.length === 0) {
        this.logger.log('No expiring matrículas in the next 30 days');
        return;
      }

      const adminIds = await this.userLookup.findAdminIds();
      if (adminIds.length === 0) return;

      const now = new Date();
      let flippedCount = 0;
      let notifiedCount = 0;

      for (const attachment of attachments) {
        if (!attachment.expiresAt) continue;

        const professional = await this.professionals.findById(attachment.professionalId);
        if (!professional) continue;

        const daysUntilExpiry = Math.ceil(
          (attachment.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        );
        const isExpired = daysUntilExpiry <= 0;
        const typeLabel = attachment.type === 'MATRICULA' ? 'matrícula' : 'seguro RC';

        if (isExpired && professional.availability === 'AVAILABLE') {
          await this.professionals.update(professional.id, {
            availability: 'UNAVAILABLE',
          } as never);
          flippedCount += 1;
        }

        const title = isExpired
          ? `⚠️ ${typeLabel} vencida — ${professional.name}`
          : `${typeLabel} vence en ${daysUntilExpiry} día${daysUntilExpiry === 1 ? '' : 's'}`;
        const message = isExpired
          ? `La ${typeLabel} de ${professional.name} venció el ${attachment.expiresAt.toLocaleDateString('es-AR')}. El profesional fue marcado como no disponible.`
          : `La ${typeLabel} de ${professional.name} vence el ${attachment.expiresAt.toLocaleDateString('es-AR')}. Pedí renovación antes de asignarle nuevas solicitudes.`;

        for (const adminId of adminIds) {
          await this.notifications.createNotification({
            userId: adminId,
            type: 'SYSTEM',
            title,
            message,
            data: {
              professionalId: professional.id,
              attachmentId: attachment.id,
              expiresAt: attachment.expiresAt.toISOString(),
              isExpired,
            },
          });
          notifiedCount += 1;
        }
      }

      this.logger.log(
        `matricula-expiry: ${attachments.length} expiring, ${flippedCount} flipped to UNAVAILABLE, ${notifiedCount} notifications sent`,
      );
    } catch (err) {
      this.logger.error('matricula-expiry cron failed', err);
      Sentry.captureException(err);
    } finally {
      await this.lockService.releaseLock(lockKey, owner);
    }
  }
}
