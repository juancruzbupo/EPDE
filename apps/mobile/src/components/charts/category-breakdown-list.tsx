import type { CategoryBreakdownItem } from '@epde/shared';
import { memo, useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { AnimatedListItem } from '@/components/animated-list-item';
import { TIMING, useReducedMotion } from '@/lib/animations';
import { TYPE } from '@/lib/fonts';

interface CategoryBreakdownListProps {
  data: CategoryBreakdownItem[];
}

const ProgressBar = memo(function ProgressBar({
  percent,
  color,
  reduced,
}: {
  percent: number;
  color: string;
  reduced: boolean;
}) {
  const width = useSharedValue(reduced ? percent : 0);

  useEffect(() => {
    if (reduced) {
      width.value = percent;
      return;
    }
    width.value = withTiming(percent, {
      duration: TIMING.slow,
      easing: Easing.out(Easing.quad),
    });
  }, [percent, reduced, width]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
    backgroundColor: color,
  }));

  return (
    <View className="bg-muted h-2 overflow-hidden rounded-full">
      <Animated.View style={[animatedStyle, { height: '100%', borderRadius: 9999 }]} />
    </View>
  );
});

const ConditionDots = memo(function ConditionDots({ avgCondition }: { avgCondition: number }) {
  // avgCondition: 1 = CRITICAL, 5 = EXCELLENT
  const filled = Math.round(avgCondition);
  return (
    <View className="flex-row gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <View
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: i <= filled ? getConditionDotColor(filled) : '#e5e5e5',
          }}
        />
      ))}
    </View>
  );
});

function getConditionDotColor(level: number): string {
  if (level >= 4) return '#6b9b7a'; // green
  if (level >= 3) return '#d4a843'; // yellow
  return '#c45b4b'; // red
}

function getProgressColor(percent: number): string {
  if (percent > 80) return '#6b9b7a'; // green / success
  if (percent >= 50) return '#c4704b'; // primary / terracotta
  return '#c45b4b'; // destructive
}

const CategoryRow = memo(function CategoryRow({
  item,
  index,
}: {
  item: CategoryBreakdownItem;
  index: number;
}) {
  const reduced = useReducedMotion();
  const percent =
    item.totalTasks > 0 ? Math.round((item.completedTasks / item.totalTasks) * 100) : 0;
  const color = getProgressColor(percent);

  return (
    <AnimatedListItem index={index}>
      <View className="border-border bg-card mb-2 rounded-xl border p-3">
        <View className="mb-2 flex-row items-center justify-between">
          <Text style={TYPE.titleSm} className="text-foreground flex-1" numberOfLines={1}>
            {item.categoryName}
          </Text>
          <ConditionDots avgCondition={item.avgCondition} />
        </View>

        <ProgressBar percent={percent} color={color} reduced={reduced} />

        <View className="mt-2 flex-row items-center justify-between">
          <Text style={TYPE.labelSm} className="text-muted-foreground">
            {item.completedTasks}/{item.totalTasks} tareas · {percent}%
          </Text>
          {item.overdueTasks > 0 && (
            <Text style={TYPE.labelSm} className="text-destructive">
              {item.overdueTasks} vencida{item.overdueTasks > 1 ? 's' : ''}
            </Text>
          )}
        </View>
      </View>
    </AnimatedListItem>
  );
});

export const CategoryBreakdownList = memo(function CategoryBreakdownList({
  data,
}: CategoryBreakdownListProps) {
  if (data.length === 0) {
    return (
      <View className="items-center py-4">
        <Text style={TYPE.bodySm} className="text-muted-foreground">
          Sin categorias registradas
        </Text>
      </View>
    );
  }

  return (
    <View>
      {data.map((item, index) => (
        <CategoryRow key={item.categoryName} item={item} index={index} />
      ))}
    </View>
  );
});
