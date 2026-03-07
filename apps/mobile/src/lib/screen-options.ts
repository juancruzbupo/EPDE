import { colors } from './colors';
import { TYPE } from './fonts';

/** Shared screen options for expo-router Stack headers */
export const defaultScreenOptions = {
  headerStyle: { backgroundColor: colors.background },
  headerTintColor: colors.foreground,
  headerTitleStyle: { fontFamily: TYPE.titleLg.fontFamily },
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
  tabBarLabelStyle: { fontFamily: TYPE.labelMd.fontFamily, fontSize: TYPE.labelMd.fontSize },
} as const;
