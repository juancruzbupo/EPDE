import { createQuoteTemplateQueries } from '@epde/shared';

import { apiClient } from '../api-client';

export type { QuoteTemplateItem, QuoteTemplatePublic } from '@epde/shared';

const queries = createQuoteTemplateQueries(apiClient);
export const {
  getQuoteTemplates,
  getQuoteTemplate,
  createQuoteTemplate,
  updateQuoteTemplate,
  deleteQuoteTemplate,
} = queries;
