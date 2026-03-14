import type { ClientFiltersInput, CreateClientInput, UpdateClientInput } from '@epde/shared';
import { UserRole, UserStatus } from '@epde/shared';
import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { DuplicateClientEmailError } from '../common/exceptions/domain.exceptions';
import { EmailQueueService } from '../email/email-queue.service';
import { ClientsRepository } from './clients.repository';

@Injectable()
export class ClientsService {
  private readonly logger = new Logger(ClientsService.name);

  constructor(
    private readonly clientsRepository: ClientsRepository,
    private readonly emailQueueService: EmailQueueService,
    private readonly jwtService: JwtService,
  ) {}

  async listClients(filters: ClientFiltersInput) {
    const result = await this.clientsRepository.findClients({
      cursor: filters.cursor,
      take: filters.take,
      search: filters.search,
      status: filters.status,
    });

    return {
      ...result,
      data: result.data.map(({ passwordHash: _, ...client }) => client),
    };
  }

  async getClient(id: string) {
    const client = await this.clientsRepository.findById(id);
    if (!client || client.role !== UserRole.CLIENT) {
      throw new NotFoundException('Cliente no encontrado');
    }
    const { passwordHash: _passwordHash, ...clientWithoutPassword } = client;
    return clientWithoutPassword;
  }

  async createClient(dto: CreateClientInput) {
    const existing = await this.clientsRepository.findByEmailIncludingDeleted(dto.email);

    let client;
    if (existing && existing.deletedAt) {
      client = await this.clientsRepository.update(existing.id, {
        name: dto.name,
        phone: dto.phone,
        status: UserStatus.INVITED,
        passwordHash: null,
        deletedAt: null,
      });
    } else if (existing) {
      try {
        throw new DuplicateClientEmailError();
      } catch (error) {
        if (error instanceof DuplicateClientEmailError) {
          throw new ConflictException(error.message);
        }
        throw error;
      }
    } else {
      client = await this.clientsRepository.create({
        email: dto.email,
        name: dto.name,
        phone: dto.phone,
        role: UserRole.CLIENT,
        status: UserStatus.INVITED,
      });
    }

    const token = this.jwtService.sign(
      { sub: client.id, email: client.email, purpose: 'invite' },
      { expiresIn: '24h' },
    );

    // Non-blocking: client is created even if email queue is down.
    // Admin can re-invite later from the client detail page.
    try {
      await this.emailQueueService.enqueueInvite(client.email, client.name, token);
    } catch (error) {
      this.logger.error(
        `Failed to enqueue invite email for ${client.email}: ${(error as Error).message}`,
      );
    }

    const { passwordHash: _passwordHash, ...clientWithoutPassword } = client;
    return clientWithoutPassword;
  }

  async reinviteClient(id: string) {
    const client = await this.clientsRepository.findById(id);
    if (!client || client.role !== UserRole.CLIENT) {
      throw new NotFoundException('Cliente no encontrado');
    }
    if (client.status !== UserStatus.INVITED) {
      throw new ConflictException('Solo se puede reinvitar a clientes en estado INVITED');
    }

    const token = this.jwtService.sign(
      { sub: client.id, email: client.email, purpose: 'invite' },
      { expiresIn: '24h' },
    );

    await this.emailQueueService.enqueueInvite(client.email, client.name, token);

    const { passwordHash: _passwordHash, ...clientWithoutPassword } = client;
    return clientWithoutPassword;
  }

  async updateClient(id: string, dto: UpdateClientInput) {
    const client = await this.clientsRepository.findById(id);
    if (!client || client.role !== UserRole.CLIENT) {
      throw new NotFoundException('Cliente no encontrado');
    }

    const updated = await this.clientsRepository.update(id, dto);
    const { passwordHash: _passwordHash, ...clientWithoutPassword } = updated;
    return clientWithoutPassword;
  }

  async deleteClient(id: string) {
    const client = await this.clientsRepository.findById(id);
    if (!client || client.role !== UserRole.CLIENT) {
      throw new NotFoundException('Cliente no encontrado');
    }

    await this.clientsRepository.softDelete(id);
    return { data: null, message: 'Cliente eliminado' };
  }

  async findByEmail(email: string) {
    return this.clientsRepository.findByEmail(email);
  }
}
