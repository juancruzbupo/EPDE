import { createAuthFeatureQueries } from '@epde/shared';

import { apiClient } from '../api-client';

const queries = createAuthFeatureQueries(apiClient);

export const { getMilestones, useStreakFreeze: activateStreakFreeze } = queries;
