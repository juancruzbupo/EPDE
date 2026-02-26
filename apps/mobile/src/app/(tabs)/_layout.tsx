import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useUnreadCount } from '@/hooks/use-notifications';

export default function TabLayout() {
  const { data: unreadCount } = useUnreadCount();

  return (
    <Tabs
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
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>&#127968;</Text>,
        }}
      />
      <Tabs.Screen
        name="properties"
        options={{
          title: 'Propiedades',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>&#127960;</Text>,
        }}
      />
      <Tabs.Screen
        name="budgets"
        options={{
          title: 'Presupuestos',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>&#128203;</Text>,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Avisos',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>&#128276;</Text>,
          tabBarBadge: unreadCount && unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: { backgroundColor: '#c4704b', fontSize: 10 },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>&#128100;</Text>,
        }}
      />
    </Tabs>
  );
}
