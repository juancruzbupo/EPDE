import type {
  AddInspectionItemInput,
  CreateInspectionInput,
  InspectionChecklist,
  UpdateInspectionItemInput,
} from '@epde/shared';

import { apiClient } from '../api-client';

interface ApiResponse<T> {
  data: T;
}

export async function getInspections(
  propertyId: string,
): Promise<ApiResponse<InspectionChecklist[]>> {
  const { data } = await apiClient.get(`/inspections/property/${propertyId}`);
  return data;
}

export async function getInspection(id: string): Promise<ApiResponse<InspectionChecklist>> {
  const { data } = await apiClient.get(`/inspections/${id}`);
  return data;
}

export async function createInspection(
  dto: CreateInspectionInput,
): Promise<ApiResponse<InspectionChecklist>> {
  const { data } = await apiClient.post('/inspections', dto);
  return data;
}

export async function updateInspectionItem(
  itemId: string,
  dto: UpdateInspectionItemInput,
): Promise<ApiResponse<unknown>> {
  const { data } = await apiClient.patch(`/inspections/items/${itemId}`, dto);
  return data;
}

export async function addInspectionItem(
  checklistId: string,
  dto: AddInspectionItemInput,
): Promise<ApiResponse<unknown>> {
  const { data } = await apiClient.post(`/inspections/${checklistId}/items`, dto);
  return data;
}

export async function linkInspectionTask(
  itemId: string,
  taskId: string,
): Promise<ApiResponse<unknown>> {
  const { data } = await apiClient.patch(`/inspections/items/${itemId}/link-task`, { taskId });
  return data;
}
