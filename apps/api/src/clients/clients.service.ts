import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ClientsRepository } from './clients.repository';
import { EmailService } from '../email/email.service';
import { UserRole } from '@epde/shared';
import type { CreateClientInput, UpdateClientInput, ClientFiltersInput } from '@epde/shared';

@Injectable()
export class ClientsService {
  constructor(
    private readonly clientsRepository: ClientsRepository,
    private readonly emailService: EmailService,
    private readonly jwtService: JwtService,
  ) {}

  async listClients(filters: ClientFiltersInput) {
    return this.clientsRepository.findClients({
      cursor: filters.cursor,
      take: filters.take,
      search: filters.search,
      status: filters.status,
    });
  }

  async getClient(id: string) {
    const client = await this.clientsRepository.findById(id);
    if (!client || client.role !== UserRole.CLIENT) {
      throw new NotFoundException('Cliente no encontrado');
    }
    const { passwordHash: _, ...clientWithoutPassword } = client;
    void _;
    return clientWithoutPassword;
  }

  async createClient(dto: CreateClientInput) {
    const existing = await this.clientsRepository.findByEmail(dto.email);

    let client;
    if (existing && existing.deletedAt) {
      client = await this.clientsRepository.update(existing.id, {
        name: dto.name,
        phone: dto.phone,
        status: 'INVITED',
        passwordHash: null,
        deletedAt: null,
      });
    } else if (existing) {
      throw new ConflictException('Ya existe un usuario con ese email');
    } else {
      client = await this.clientsRepository.create({
        email: dto.email,
        name: dto.name,
        phone: dto.phone,
        role: UserRole.CLIENT,
        status: 'INVITED',
      });
    }

    const token = this.jwtService.sign(
      { sub: client.id, email: client.email, purpose: 'invite' },
      { expiresIn: '24h' },
    );

    await this.emailService.sendInviteEmail(client.email, client.name, token);

    const { passwordHash: _, ...clientWithoutPassword } = client;
    void _;
    return clientWithoutPassword;
  }

  async updateClient(id: string, dto: UpdateClientInput) {
    const client = await this.clientsRepository.findById(id);
    if (!client || client.role !== UserRole.CLIENT) {
      throw new NotFoundException('Cliente no encontrado');
    }

    const updated = await this.clientsRepository.update(id, dto);
    const { passwordHash: _, ...clientWithoutPassword } = updated;
    void _;
    return clientWithoutPassword;
  }

  async deleteClient(id: string) {
    const client = await this.clientsRepository.findById(id);
    if (!client || client.role !== UserRole.CLIENT) {
      throw new NotFoundException('Cliente no encontrado');
    }

    await this.clientsRepository.softDelete(id);
    return { message: 'Cliente eliminado' };
  }

  async findByEmail(email: string) {
    return this.clientsRepository.findByEmail(email);
  }
}
