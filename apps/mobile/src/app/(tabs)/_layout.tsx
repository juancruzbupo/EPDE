import { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useUnreadCount } from '@/hooks/use-notifications';
import { OfflineBanner } from '@/components/offline-banner';
import { SPRING, useReducedMotion } from '@/lib/animations';
import { haptics } from '@/lib/haptics';

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
        screenOptions={{
          headerStyle: { backgroundColor: '#fafaf8' },
          headerTintColor: '#2e2a27',
          headerTitleStyle: { fontFamily: 'DMSans_700Bold' },
          tabBarStyle: { backgroundColor: '#fafaf8', borderTopColor: '#e8ddd3' },
          tabBarActiveTintColor: '#c4704b',
          tabBarInactiveTintColor: '#4a4542',
          tabBarLabelStyle: { fontFamily: 'DMSans_500Medium', fontSize: 12 },
        }}
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
            tabBarBadgeStyle: { backgroundColor: '#c4704b', fontSize: 10 },
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
