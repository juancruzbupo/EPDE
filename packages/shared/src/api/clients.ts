import type { AxiosInstance } from 'axios';
import type { PaginatedResponse, ApiResponse, ClientPublic } from '../types';
import type { UserStatus } from '../types/enums';

export interface ClientFilters {
  search?: string;
  status?: UserStatus;
  cursor?: string;
  take?: number;
}

export function createClientQueries(apiClient: AxiosInstance) {
  return {
    async getClients(
      params: ClientFilters,
      signal?: AbortSignal,
    ): Promise<PaginatedResponse<ClientPublic>> {
      const { data } = await apiClient.get('/clients', { params, signal });
      return data;
    },

    async getClient(id: string, signal?: AbortSignal): Promise<ApiResponse<ClientPublic>> {
      const { data } = await apiClient.get(`/clients/${id}`, { signal });
      return data;
    },

    async createClient(dto: {
      email: string;
      name: string;
      phone?: string;
    }): Promise<ApiResponse<ClientPublic>> {
      const { data } = await apiClient.post('/clients', dto);
      return data;
    },

    async updateClient(
      id: string,
      dto: { name?: string; phone?: string; status?: UserStatus },
    ): Promise<ApiResponse<ClientPublic>> {
      const { data } = await apiClient.patch(`/clients/${id}`, dto);
      return data;
    },

    async deleteClient(id: string): Promise<ApiResponse<ClientPublic>> {
      const { data } = await apiClient.delete(`/clients/${id}`);
      return data;
    },
  };
}
