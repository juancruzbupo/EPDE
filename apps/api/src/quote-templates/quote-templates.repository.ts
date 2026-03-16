import { Injectable } from '@nestjs/common';
import type { QuoteTemplate } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

const INCLUDE_ITEMS = { items: { orderBy: { displayOrder: 'asc' as const } } };

@Injectable()
export class QuoteTemplatesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<QuoteTemplate[]> {
    return this.prisma.quoteTemplate.findMany({
      include: INCLUDE_ITEMS,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return this.prisma.quoteTemplate.findUnique({
      where: { id },
      include: INCLUDE_ITEMS,
    });
  }

  async create(data: {
    name: string;
    createdBy: string;
    items: { description: string; quantity: number; unitPrice: number; displayOrder?: number }[];
  }) {
    return this.prisma.quoteTemplate.create({
      data: {
        name: data.name,
        createdBy: data.createdBy,
        items: {
          create: data.items.map((item, i) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            displayOrder: item.displayOrder ?? i,
          })),
        },
      },
      include: INCLUDE_ITEMS,
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      items?: { description: string; quantity: number; unitPrice: number; displayOrder?: number }[];
    },
  ) {
    return this.prisma.$transaction(async (tx) => {
      if (data.items) {
        await tx.quoteTemplateItem.deleteMany({ where: { templateId: id } });
        await tx.quoteTemplateItem.createMany({
          data: data.items.map((item, i) => ({
            templateId: id,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            displayOrder: item.displayOrder ?? i,
          })),
        });
      }

      return tx.quoteTemplate.update({
        where: { id },
        data: { name: data.name },
        include: INCLUDE_ITEMS,
      });
    });
  }

  async delete(id: string) {
    return this.prisma.quoteTemplate.delete({ where: { id } });
  }
}
