import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useReducedMotion } from '@/lib/animations';

interface SkeletonPlaceholderProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  className?: string;
}

export function SkeletonPlaceholder({
  width = '100%',
  height = 16,
  borderRadius = 8,
  className,
}: SkeletonPlaceholderProps) {
  const reduced = useReducedMotion();
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (reduced) {
      opacity.value = 0.5;
      return;
    }
    opacity.value = withRepeat(
      withTiming(0.4, { duration: 1000, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [reduced, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={animatedStyle} className={className}>
      <View className="bg-muted" style={{ width, height, borderRadius }} />
    </Animated.View>
  );
}

export function StatCardSkeleton() {
  return (
    <View className="border-border bg-card flex-1 rounded-xl border p-3">
      <SkeletonPlaceholder width={80} height={12} borderRadius={4} />
      <View className="mt-2">
        <SkeletonPlaceholder width={48} height={28} borderRadius={6} />
      </View>
    </View>
  );
}

export function ListItemSkeleton() {
  return (
    <View className="border-border bg-card mb-3 rounded-xl border p-4">
      <View className="mb-2 flex-row items-center justify-between">
        <SkeletonPlaceholder width="60%" height={14} borderRadius={4} />
        <SkeletonPlaceholder width={64} height={20} borderRadius={10} />
      </View>
      <SkeletonPlaceholder width="40%" height={12} borderRadius={4} />
      <View className="mt-2">
        <SkeletonPlaceholder width="80%" height={12} borderRadius={4} />
      </View>
    </View>
  );
}
