import { colors } from './colors';

/** Shared screen options for expo-router Stack headers */
export const defaultScreenOptions = {
  headerStyle: { backgroundColor: colors.background },
  headerTintColor: colors.foreground,
  headerTitleStyle: { fontFamily: 'DMSans_700Bold' },
} as const;

/** Shared tab bar screen options */
export const defaultTabBarOptions = {
  ...defaultScreenOptions,
  tabBarStyle: {
    backgroundColor: colors.background,
    borderTopColor: colors.border,
  },
  tabBarActiveTintColor: colors.primary,
  tabBarInactiveTintColor: colors.mutedForeground,
  tabBarLabelStyle: { fontFamily: 'DMSans_500Medium', fontSize: 12 },
} as const;
