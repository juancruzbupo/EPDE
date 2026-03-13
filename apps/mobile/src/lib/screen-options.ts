import { COLORS } from './colors';
import { TYPE } from './fonts';

/** Shared screen options for expo-router Stack headers */
export const defaultScreenOptions = {
  headerStyle: { backgroundColor: COLORS.background },
  headerTintColor: COLORS.foreground,
  headerTitleStyle: { fontFamily: TYPE.titleLg.fontFamily },
} as const;

/** Shared tab bar screen options */
export const defaultTabBarOptions = {
  ...defaultScreenOptions,
  tabBarStyle: {
    backgroundColor: COLORS.background,
    borderTopColor: COLORS.border,
  },
  tabBarActiveTintColor: COLORS.primary,
  tabBarInactiveTintColor: COLORS.mutedForeground,
  tabBarLabelStyle: { fontFamily: TYPE.labelMd.fontFamily, fontSize: TYPE.labelMd.fontSize },
} as const;
