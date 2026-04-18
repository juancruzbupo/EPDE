import { Injectable } from '@nestjs/common';
import type {
  Prisma,
  ProfessionalAttachment,
  ProfessionalAttachmentType,
  ProfessionalRating,
  ProfessionalTag,
  ProfessionalTimelineNote,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

/**
 * Covers sub-resources of Professional (ratings, notes, tags, attachments).
 * Split from ProfessionalsRepository to keep the main repo focused on the
 * primary entity + list/detail orchestration.
 */
@Injectable()
export class ProfessionalSubRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Ratings ───────────────────────────────────────────

  async createRating(
    data: Prisma.ProfessionalRatingUncheckedCreateInput,
  ): Promise<ProfessionalRating> {
    return this.prisma.professionalRating.create({ data });
  }

  async findRating(id: string, professionalId: string): Promise<ProfessionalRating | null> {
    return this.prisma.professionalRating.findFirst({ where: { id, professionalId } });
  }

  async deleteRating(id: string): Promise<void> {
    await this.prisma.professionalRating.delete({ where: { id } });
  }

  // ─── Timeline notes ────────────────────────────────────

  async createTimelineNote(
    data: Prisma.ProfessionalTimelineNoteUncheckedCreateInput,
  ): Promise<ProfessionalTimelineNote> {
    return this.prisma.professionalTimelineNote.create({ data });
  }

  // ─── Tags ──────────────────────────────────────────────

  async createTag(data: Prisma.ProfessionalTagUncheckedCreateInput): Promise<ProfessionalTag> {
    return this.prisma.professionalTag.create({ data });
  }

  async findTag(professionalId: string, tag: string): Promise<ProfessionalTag | null> {
    return this.prisma.professionalTag.findUnique({
      where: { professionalId_tag: { professionalId, tag } },
    });
  }

  async deleteTag(id: string): Promise<void> {
    await this.prisma.professionalTag.delete({ where: { id } });
  }

  // ─── Attachments ───────────────────────────────────────

  async createAttachment(
    data: Prisma.ProfessionalAttachmentUncheckedCreateInput,
  ): Promise<ProfessionalAttachment> {
    return this.prisma.professionalAttachment.create({ data });
  }

  async findAttachment(id: string, professionalId: string): Promise<ProfessionalAttachment | null> {
    return this.prisma.professionalAttachment.findFirst({ where: { id, professionalId } });
  }

  async updateAttachmentVerification(
    id: string,
    verifiedBy: string,
  ): Promise<ProfessionalAttachment> {
    return this.prisma.professionalAttachment.update({
      where: { id },
      data: { verifiedAt: new Date(), verifiedBy },
    });
  }

  async deleteAttachment(id: string): Promise<void> {
    await this.prisma.professionalAttachment.delete({ where: { id } });
  }

  async findExpiringAttachments(
    types: ProfessionalAttachmentType[],
    withinDays: number,
  ): Promise<ProfessionalAttachment[]> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + withinDays);
    return this.prisma.professionalAttachment.findMany({
      where: {
        type: { in: types },
        expiresAt: { lte: cutoff, not: null },
      },
    });
  }
}
