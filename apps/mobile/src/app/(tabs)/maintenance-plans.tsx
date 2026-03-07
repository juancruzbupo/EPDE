import { memo, useCallback } from 'react';
import { View, Text, RefreshControl, Pressable, SectionList } from 'react-native';
import { useRouter } from 'expo-router';
import { usePlans } from '@/hooks/use-plans';
import { AnimatedListItem } from '@/components/animated-list-item';
import { PlanStatusBadge } from '@/components/status-badge';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { TYPE } from '@/lib/fonts';
import { PLAN_STATUS_LABELS } from '@epde/shared';
import type { PlanListItem } from '@/lib/api/maintenance-plans';

const PlanCard = memo(function PlanCard({ plan }: { plan: PlanListItem }) {
  const router = useRouter();

  return (
    <Pressable
      className="border-border bg-card mb-3 rounded-xl border p-3"
      onPress={() => router.push(`/property/${plan.property.id}` as never)}
    >
      <View className="mb-1 flex-row items-center justify-between">
        <Text style={TYPE.titleSm} className="text-foreground flex-1" numberOfLines={1}>
          {plan.name}
        </Text>
        <PlanStatusBadge status={plan.status} />
      </View>
      <Text style={TYPE.bodySm} className="text-muted-foreground">
        {plan.property.address}, {plan.property.city}
        {' · '}
        <Text style={TYPE.labelMd} className="text-foreground/60">
          {plan._count.tasks} tarea{plan._count.tasks !== 1 ? 's' : ''}
        </Text>
      </Text>
    </Pressable>
  );
});

const STATUS_ORDER = ['ACTIVE', 'DRAFT', 'ARCHIVED'] as const;

export default function MaintenancePlansScreen() {
  const { data: plans, isLoading, error, refetch } = usePlans();

  if (error && !plans) {
    return <ErrorState onRetry={refetch} />;
  }

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const sections = STATUS_ORDER.map((status) => ({
    title: PLAN_STATUS_LABELS[status] ?? status,
    data: (plans ?? []).filter((p) => p.status === status),
  })).filter((s) => s.data.length > 0);

  if (!isLoading && sections.length === 0) {
    return (
      <View className="bg-background flex-1">
        <View className="px-4 pt-6 pb-2">
          <Text style={TYPE.displayLg} className="text-foreground">
            Planes
          </Text>
        </View>
        <EmptyState
          title="Sin planes"
          message="Los planes de mantenimiento se crean al agregar una propiedad."
        />
      </View>
    );
  }

  return (
    <SectionList
      className="bg-background flex-1"
      contentContainerStyle={{ padding: 16, flexGrow: 1 }}
      sections={sections}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <AnimatedListItem index={index}>
          <PlanCard plan={item} />
        </AnimatedListItem>
      )}
      renderSectionHeader={({ section }) => (
        <Text
          style={TYPE.labelMd}
          className="text-muted-foreground mt-4 mb-2 tracking-wider uppercase"
        >
          {section.title}
        </Text>
      )}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} />}
      ListHeaderComponent={
        <Text style={TYPE.displayLg} className="text-foreground mb-2">
          Planes
        </Text>
      }
      stickySectionHeadersEnabled={false}
    />
  );
}
