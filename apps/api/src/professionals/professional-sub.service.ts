import type {
  CreateAttachmentInput,
  CreateRatingInput,
  CreateTagInput,
  CreateTimelineNoteInput,
} from '@epde/shared';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { ProfessionalSubRepository } from './professional-sub.repository';
import { ProfessionalsRepository } from './professionals.repository';

@Injectable()
export class ProfessionalSubService {
  constructor(
    private readonly professionals: ProfessionalsRepository,
    private readonly subRepo: ProfessionalSubRepository,
  ) {}

  // ─── Ratings ───────────────────────────────────────────

  async createRating(professionalId: string, authorId: string, dto: CreateRatingInput) {
    await this.assertProfessionalExists(professionalId);
    return this.subRepo.createRating({
      professionalId,
      authorId,
      serviceRequestId: dto.serviceRequestId ?? null,
      score: dto.score,
      punctuality: dto.punctuality ?? null,
      quality: dto.quality ?? null,
      priceValue: dto.priceValue ?? null,
      adminComment: dto.adminComment ?? null,
      clientComment: dto.clientComment ?? null,
    });
  }

  async deleteRating(professionalId: string, ratingId: string) {
    const rating = await this.subRepo.findRating(ratingId, professionalId);
    if (!rating) throw new NotFoundException('Valoración no encontrada');
    await this.subRepo.deleteRating(ratingId);
  }

  // ─── Timeline notes ────────────────────────────────────

  async createTimelineNote(professionalId: string, authorId: string, dto: CreateTimelineNoteInput) {
    await this.assertProfessionalExists(professionalId);
    return this.subRepo.createTimelineNote({
      professionalId,
      authorId,
      content: dto.content,
    });
  }

  // ─── Tags ──────────────────────────────────────────────

  async createTag(professionalId: string, dto: CreateTagInput) {
    await this.assertProfessionalExists(professionalId);
    const normalized = dto.tag.startsWith('#')
      ? dto.tag.toLowerCase()
      : `#${dto.tag.toLowerCase()}`;
    try {
      return await this.subRepo.createTag({ professionalId, tag: normalized });
    } catch (err) {
      if ((err as { code?: string }).code === 'P2002') {
        throw new ConflictException('Ese tag ya existe');
      }
      throw err;
    }
  }

  async deleteTag(professionalId: string, tag: string) {
    const normalized = decodeURIComponent(tag);
    const existing = await this.subRepo.findTag(professionalId, normalized);
    if (!existing) throw new NotFoundException('Tag no encontrado');
    await this.subRepo.deleteTag(existing.id);
  }

  // ─── Attachments ───────────────────────────────────────

  async createAttachment(professionalId: string, dto: CreateAttachmentInput) {
    await this.assertProfessionalExists(professionalId);
    if (dto.type === 'MATRICULA' && dto.expiresAt == null) {
      throw new BadRequestException('La matrícula requiere fecha de vencimiento');
    }
    return this.subRepo.createAttachment({
      professionalId,
      type: dto.type,
      url: dto.url,
      fileName: dto.fileName,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
    });
  }

  async verifyAttachment(professionalId: string, attachmentId: string, verifiedBy: string) {
    const attachment = await this.subRepo.findAttachment(attachmentId, professionalId);
    if (!attachment) throw new NotFoundException('Adjunto no encontrado');
    return this.subRepo.updateAttachmentVerification(attachmentId, verifiedBy);
  }

  async deleteAttachment(professionalId: string, attachmentId: string) {
    const attachment = await this.subRepo.findAttachment(attachmentId, professionalId);
    if (!attachment) throw new NotFoundException('Adjunto no encontrado');
    await this.subRepo.deleteAttachment(attachmentId);
  }

  private async assertProfessionalExists(id: string) {
    const professional = await this.professionals.findById(id);
    if (!professional) throw new NotFoundException('Profesional no encontrado');
  }
}
