import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { OfflineBanner } from '@/components/offline-banner';
import { useUnreadCount } from '@/hooks/use-notifications';
import { SPRING, useReducedMotion } from '@/lib/animations';
import { COLORS } from '@/lib/colors';
import { haptics } from '@/lib/haptics';
import { defaultTabBarOptions } from '@/lib/screen-options';

function AnimatedTabIcon({
  emoji,
  color,
  focused,
}: {
  emoji: string;
  color: string;
  focused: boolean;
}) {
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);

  useEffect(() => {
    if (reduced) return;
    scale.value = withSpring(focused ? 1.15 : 1, SPRING.bouncy);
  }, [focused, reduced, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Text style={{ color, fontSize: 20 }}>{emoji}</Text>
    </Animated.View>
  );
}

export default function TabLayout() {
  const { data: unreadCount } = useUnreadCount();

  return (
    <View className="flex-1">
      <OfflineBanner />
      <Tabs
        screenListeners={{
          tabPress: () => haptics.selection(),
        }}
        screenOptions={defaultTabBarOptions}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Inicio',
            tabBarIcon: ({ color, focused }) => (
              <AnimatedTabIcon emoji="🏠" color={color} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="properties"
          options={{
            title: 'Propiedades',
            tabBarIcon: ({ color, focused }) => (
              <AnimatedTabIcon emoji="🏘" color={color} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="maintenance-plans"
          options={{
            title: 'Planes',
            tabBarIcon: ({ color, focused }) => (
              <AnimatedTabIcon emoji="📅" color={color} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="tasks"
          options={{
            title: 'Tareas',
            tabBarIcon: ({ color, focused }) => (
              <AnimatedTabIcon emoji="✅" color={color} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="budgets"
          options={{
            title: 'Presupuestos',
            tabBarIcon: ({ color, focused }) => (
              <AnimatedTabIcon emoji="📋" color={color} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="notifications"
          options={{
            title: 'Avisos',
            tabBarIcon: ({ color, focused }) => (
              <AnimatedTabIcon emoji="🔔" color={color} focused={focused} />
            ),
            tabBarBadge: unreadCount && unreadCount > 0 ? unreadCount : undefined,
            tabBarBadgeStyle: { backgroundColor: COLORS.primary, fontSize: 10 },
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Perfil',
            tabBarIcon: ({ color, focused }) => (
              <AnimatedTabIcon emoji="👤" color={color} focused={focused} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}
