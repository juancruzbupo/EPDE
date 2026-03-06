import { createNotificationQueries } from '@epde/shared';
import { apiClient } from '../api-client';

export type { NotificationPublic, NotificationFilters } from '@epde/shared';

const queries = createNotificationQueries(apiClient);
export const { getNotifications, getUnreadCount, markAsRead, markAllAsRead } = queries;
