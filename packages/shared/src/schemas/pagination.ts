import { z } from 'zod';

import { PAGINATION_DEFAULT_TAKE, PAGINATION_MAX_TAKE } from '../constants';

export const cursorPaginationSchema = z.object({
  cursor: z.string().min(1).optional(),
  take: z.coerce.number().int().min(1).max(PAGINATION_MAX_TAKE).default(PAGINATION_DEFAULT_TAKE),
  search: z.string().optional(),
});

export type CursorPaginationInput = z.infer<typeof cursorPaginationSchema>;
