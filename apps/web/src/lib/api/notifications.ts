import { createNotificationQueries } from '@epde/shared/api';
import { apiClient } from '../api-client';

export type { NotificationPublic } from '@epde/shared';
export type { NotificationFilters } from '@epde/shared/api';

const queries = createNotificationQueries(apiClient);
export const { getNotifications, getUnreadCount, markAsRead, markAllAsRead } = queries;
