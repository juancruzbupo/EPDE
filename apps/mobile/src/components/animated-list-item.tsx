import type { PropsWithChildren } from 'react';
import Animated from 'react-native-reanimated';
import { useAnimatedEntry, usePressAnimation } from '@/lib/animations';
import { haptics } from '@/lib/haptics';

interface AnimatedListItemProps {
  index: number;
  onPressIn?: () => void;
  onPressOut?: () => void;
}

export function AnimatedListItem({ index, children }: PropsWithChildren<AnimatedListItemProps>) {
  const entryStyle = useAnimatedEntry(index * 50);
  const { animatedStyle: pressStyle, onPressIn, onPressOut } = usePressAnimation();

  const handlePressIn = () => {
    haptics.light();
    onPressIn();
  };

  return (
    <Animated.View
      style={[entryStyle, pressStyle]}
      onTouchStart={handlePressIn}
      onTouchEnd={onPressOut}
      onTouchCancel={onPressOut}
    >
      {children}
    </Animated.View>
  );
}
