import { apiClient } from '../api-client';
import type { PaginatedResponse, ApiResponse, ClientPublic } from '@epde/shared';

export type { ClientPublic };

export interface ClientFilters {
  search?: string;
  status?: string;
  cursor?: string;
  take?: number;
}

export async function getClients(
  params: ClientFilters,
  signal?: AbortSignal,
): Promise<PaginatedResponse<ClientPublic>> {
  const { data } = await apiClient.get('/clients', { params, signal });
  return data;
}

export async function getClient(
  id: string,
  signal?: AbortSignal,
): Promise<ApiResponse<ClientPublic>> {
  const { data } = await apiClient.get(`/clients/${id}`, { signal });
  return data;
}

export async function createClient(dto: { email: string; name: string; phone?: string }) {
  const { data } = await apiClient.post('/clients', dto);
  return data;
}

export async function updateClient(
  id: string,
  dto: { name?: string; phone?: string; status?: string },
) {
  const { data } = await apiClient.patch(`/clients/${id}`, dto);
  return data;
}

export async function deleteClient(id: string) {
  const { data } = await apiClient.delete(`/clients/${id}`);
  return data;
}
