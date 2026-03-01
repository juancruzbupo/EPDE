import { type ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { SPRING, useReducedMotion } from '@/lib/animations';
import { haptics } from '@/lib/haptics';

export interface SwipeAction {
  icon: string;
  color: string;
  onPress: () => void;
}

interface SwipeableRowProps {
  rightActions?: SwipeAction[];
  threshold?: number;
  children: ReactNode;
}

const ACTION_WIDTH = 72;

export function SwipeableRow({
  rightActions = [],
  threshold = ACTION_WIDTH,
  children,
}: SwipeableRowProps) {
  const reduced = useReducedMotion();
  const translateX = useSharedValue(0);
  const hasTriggeredHaptic = useSharedValue(false);

  const triggerHaptic = () => {
    haptics.light();
  };

  const executeAction = (index: number) => {
    rightActions[index]?.onPress();
  };

  const panGesture = Gesture.Pan()
    .enabled(!reduced && rightActions.length > 0)
    .activeOffsetX([-10, 10])
    .failOffsetY([-10, 10])
    .onUpdate((e) => {
      // Only allow swipe left (negative) for right actions
      const clampedX = Math.max(e.translationX, -(rightActions.length * ACTION_WIDTH));
      translateX.value = Math.min(0, clampedX);

      // Haptic when crossing threshold
      if (Math.abs(translateX.value) >= threshold && !hasTriggeredHaptic.value) {
        hasTriggeredHaptic.value = true;
        runOnJS(triggerHaptic)();
      } else if (Math.abs(translateX.value) < threshold) {
        hasTriggeredHaptic.value = false;
      }
    })
    .onEnd(() => {
      if (Math.abs(translateX.value) >= threshold && rightActions.length > 0) {
        runOnJS(executeAction)(0);
      }
      translateX.value = withSpring(0, SPRING.stiff);
      hasTriggeredHaptic.value = false;
    });

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const actionsStyle = useAnimatedStyle(() => ({
    width: Math.abs(translateX.value),
    opacity: Math.min(1, Math.abs(translateX.value) / (ACTION_WIDTH * 0.5)),
  }));

  if (reduced || rightActions.length === 0) {
    return <>{children}</>;
  }

  return (
    <View style={styles.container}>
      {/* Action buttons behind content */}
      <Animated.View style={[styles.actionsContainer, actionsStyle]}>
        {rightActions.map((action, index) => (
          <View key={index} style={[styles.action, { backgroundColor: action.color }]}>
            <Text style={styles.actionIcon}>{action.icon}</Text>
          </View>
        ))}
      </Animated.View>

      {/* Swipeable content */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={contentStyle}>{children}</Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  actionsContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  action: {
    width: ACTION_WIDTH,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  actionIcon: {
    fontSize: 24,
    color: '#ffffff',
  },
});
