import type { ActivityItem } from '@epde/shared';
import { ActivityType, formatRelativeDate } from '@epde/shared';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

import { ErrorState } from '@/components/error-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SkeletonShimmer } from '@/components/ui/skeleton-shimmer';
import { FADE_IN_UP, STAGGER_CONTAINER, STAGGER_ITEM } from '@/lib/motion';
import { ROUTES } from '@/lib/routes';
import { cn } from '@/lib/utils';

/** Resolve a dashboard activity item to an internal route. */
function getActivityHref(item: ActivityItem): string | null {
  const m = item.metadata as Record<string, string> | undefined;
  if (!m) return null;

  switch (item.type) {
    case ActivityType.CLIENT_CREATED:
      return m.clientId ? ROUTES.client(m.clientId) : null;
    case ActivityType.PROPERTY_CREATED:
      return m.propertyId ? ROUTES.property(m.propertyId) : null;
    case ActivityType.TASK_COMPLETED:
      return ROUTES.tasks;
    case ActivityType.BUDGET_REQUESTED:
      return m.budgetId ? ROUTES.budget(m.budgetId) : null;
    case ActivityType.SERVICE_REQUESTED:
      return m.serviceRequestId ? ROUTES.serviceRequest(m.serviceRequestId) : null;
    default:
      return null;
  }
}

interface ActivityFeedProps {
  activity: ActivityItem[] | undefined;
  activityLoading: boolean;
  activityError: boolean;
  refetchActivity: () => void;
  shouldAnimate: boolean;
}

export const ActivityFeed = React.memo(function ActivityFeed({
  activity,
  activityLoading,
  activityError,
  refetchActivity,
  shouldAnimate,
}: ActivityFeedProps) {
  const Wrapper = shouldAnimate ? motion.div : 'div';
  const Item = shouldAnimate ? motion.div : 'div';

  return (
    <motion.div
      className="mt-6"
      {...(shouldAnimate ? { variants: FADE_IN_UP, initial: 'hidden', animate: 'visible' } : {})}
    >
      <Card>
        <CardHeader>
          <CardTitle className="type-title-md">Actividad Reciente</CardTitle>
        </CardHeader>
        <CardContent>
          {activityLoading ? (
            <div role="status" aria-label="Cargando..." className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonShimmer key={i} className="h-6 w-full" />
              ))}
            </div>
          ) : activityError ? (
            <ErrorState
              message="No se pudo cargar la actividad reciente"
              onRetry={refetchActivity}
            />
          ) : activity && activity.length > 0 ? (
            <Wrapper
              className="space-y-3"
              {...(shouldAnimate
                ? { variants: STAGGER_CONTAINER, initial: 'hidden', animate: 'visible' }
                : {})}
            >
              <ul className="space-y-3">
                {activity.map((item) => {
                  const href = getActivityHref(item);
                  const content = (
                    <li
                      className={cn(
                        'flex items-start gap-3 rounded-lg border p-3',
                        href && 'hover:bg-muted/40 cursor-pointer transition-colors',
                      )}
                    >
                      <div className="bg-muted mt-0.5 rounded-full p-2">
                        <Activity className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <span className="text-sm font-medium">{item.description}</span>
                        <span className="text-muted-foreground mt-0.5 block text-xs">
                          {formatRelativeDate(new Date(item.timestamp))}
                        </span>
                      </div>
                    </li>
                  );

                  return (
                    <Item key={item.id} {...(shouldAnimate ? { variants: STAGGER_ITEM } : {})}>
                      {href ? (
                        <Link href={href} className="no-underline">
                          {content}
                        </Link>
                      ) : (
                        content
                      )}
                    </Item>
                  );
                })}
              </ul>
            </Wrapper>
          ) : (
            <div className="flex flex-col items-center gap-2 py-8">
              <Activity className="text-muted-foreground/60 h-8 w-8" />
              <p className="text-muted-foreground text-sm">Sin actividad reciente</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
});
