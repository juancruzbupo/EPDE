import type {
  LandingConsequenceExample,
  LandingFaqItem,
  LandingGeneral,
  LandingPricing,
} from '@/types/landing-settings';

import { apiClient } from '../api-client';

export async function getLandingSettings(): Promise<{
  data: {
    pricing?: LandingPricing;
    faq?: LandingFaqItem[];
    consequences?: LandingConsequenceExample[];
    general?: LandingGeneral;
  };
}> {
  const { data } = await apiClient.get('/landing-settings');
  return data;
}

export async function updateLandingSetting(
  key: string,
  value: unknown,
): Promise<{ data: unknown; message: string }> {
  const { data } = await apiClient.patch(`/landing-settings/${key}`, { value });
  return data;
}
