import { type ReactNode, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { TIMING, useReducedMotion } from '@/lib/animations';
import { TYPE } from '@/lib/fonts';
import { haptics } from '@/lib/haptics';

interface CollapsibleSectionProps {
  title: string;
  count?: number;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function CollapsibleSection({
  title,
  count,
  defaultOpen = true,
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const reduced = useReducedMotion();
  const rotation = useSharedValue(defaultOpen ? 1 : 0);
  const contentOpacity = useSharedValue(defaultOpen ? 1 : 0);

  const toggle = () => {
    haptics.light();
    const nextOpen = !open;
    setOpen(nextOpen);

    if (reduced) {
      rotation.value = nextOpen ? 1 : 0;
      contentOpacity.value = nextOpen ? 1 : 0;
      return;
    }

    rotation.value = withTiming(nextOpen ? 1 : 0, {
      duration: TIMING.fast,
      easing: Easing.out(Easing.quad),
    });
    contentOpacity.value = withTiming(nextOpen ? 1 : 0, {
      duration: TIMING.normal,
      easing: Easing.out(Easing.quad),
    });
  };

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value * 90}deg` }],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  return (
    <View className="mb-4">
      <Pressable onPress={toggle} className="mb-2 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Text style={TYPE.titleMd} className="text-foreground">
            {title}
          </Text>
          {count !== undefined && (
            <View className="bg-muted rounded-full px-2 py-0.5">
              <Text style={TYPE.labelSm} className="text-muted-foreground">
                {count}
              </Text>
            </View>
          )}
        </View>
        <Animated.Text style={[chevronStyle, { fontSize: 16 }]} className="text-muted-foreground">
          ▶
        </Animated.Text>
      </Pressable>

      {open && <Animated.View style={contentStyle}>{children}</Animated.View>}
    </View>
  );
}
