import type {
  AddInspectionItemInput,
  ApiResponse,
  CreateInspectionInput,
  InspectionChecklist,
  UpdateInspectionItemInput,
} from '@epde/shared';

import { apiClient } from '../api-client';

export async function getInspections(
  propertyId: string,
  signal?: AbortSignal,
): Promise<ApiResponse<InspectionChecklist[]>> {
  const { data } = await apiClient.get(`/inspections/property/${propertyId}`, { signal });
  return data;
}

export async function getInspection(
  id: string,
  signal?: AbortSignal,
): Promise<ApiResponse<InspectionChecklist>> {
  const { data } = await apiClient.get(`/inspections/${id}`, { signal });
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

export async function deleteInspection(id: string): Promise<ApiResponse<null>> {
  const { data } = await apiClient.delete(`/inspections/${id}`);
  return data;
}

export async function getInspectionTemplates(
  propertyId: string,
  signal?: AbortSignal,
): Promise<
  ApiResponse<
    {
      sector: string;
      items: { taskTemplateId: string; name: string; description: string | null }[];
    }[]
  >
> {
  const { data } = await apiClient.get(`/inspections/templates/${propertyId}`, { signal });
  return data;
}

export async function generatePlanFromInspection(
  checklistId: string,
  planName: string,
): Promise<ApiResponse<unknown>> {
  const { data } = await apiClient.post(`/inspections/${checklistId}/generate-plan`, { planName });
  return data;
}
