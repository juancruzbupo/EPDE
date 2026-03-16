import type { AxiosInstance } from 'axios';

import type { ApiResponse } from '../types';

export interface QuoteTemplateItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  displayOrder: number;
}

export interface QuoteTemplatePublic {
  id: string;
  name: string;
  createdBy: string;
  items: QuoteTemplateItem[];
  createdAt: string;
  updatedAt: string;
}

export function createQuoteTemplateQueries(apiClient: AxiosInstance) {
  return {
    async getQuoteTemplates(signal?: AbortSignal): Promise<ApiResponse<QuoteTemplatePublic[]>> {
      const { data } = await apiClient.get('/quote-templates', { signal });
      return data;
    },

    async getQuoteTemplate(
      id: string,
      signal?: AbortSignal,
    ): Promise<ApiResponse<QuoteTemplatePublic>> {
      const { data } = await apiClient.get(`/quote-templates/${id}`, { signal });
      return data;
    },

    async createQuoteTemplate(dto: {
      name: string;
      items: { description: string; quantity: number; unitPrice: number }[];
    }): Promise<ApiResponse<QuoteTemplatePublic>> {
      const { data } = await apiClient.post('/quote-templates', dto);
      return data;
    },

    async updateQuoteTemplate(
      id: string,
      dto: {
        name?: string;
        items?: { description: string; quantity: number; unitPrice: number }[];
      },
    ): Promise<ApiResponse<QuoteTemplatePublic>> {
      const { data } = await apiClient.patch(`/quote-templates/${id}`, dto);
      return data;
    },

    async deleteQuoteTemplate(id: string): Promise<ApiResponse<null>> {
      const { data } = await apiClient.delete(`/quote-templates/${id}`);
      return data;
    },
  };
}
