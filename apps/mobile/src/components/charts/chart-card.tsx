import type { ReactNode } from 'react';
import { memo } from 'react';
import { Text, View } from 'react-native';

import { EmptyState } from '@/components/empty-state';
import { StatCardSkeleton } from '@/components/skeleton-placeholder';
import { TYPE } from '@/lib/fonts';

interface ChartCardProps {
  title: string;
  description?: string;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  children: ReactNode;
}

export const ChartCard = memo(function ChartCard({
  title,
  description,
  isLoading,
  isEmpty,
  emptyMessage = 'Sin datos disponibles',
  children,
}: ChartCardProps) {
  if (isLoading) {
    return (
      <View className="border-border bg-card mb-3 rounded-xl border p-3">
        <StatCardSkeleton />
      </View>
    );
  }

  return (
    <View className="border-border bg-card mb-3 rounded-xl border p-3">
      <Text style={TYPE.titleMd} className="text-foreground mb-1">
        {title}
      </Text>
      {description ? (
        <Text style={TYPE.bodySm} className="text-muted-foreground mb-3">
          {description}
        </Text>
      ) : (
        <View className="mb-2" />
      )}

      {isEmpty ? <EmptyState title="" message={emptyMessage} /> : children}
    </View>
  );
});
