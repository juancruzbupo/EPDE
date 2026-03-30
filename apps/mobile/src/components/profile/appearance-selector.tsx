import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { TYPE } from '@/lib/fonts';
import { haptics } from '@/lib/haptics';

type ThemeMode = 'auto' | 'light' | 'dark';

const THEME_LABELS: Record<ThemeMode, string> = {
  auto: 'Automático (sistema)',
  light: 'Claro',
  dark: 'Oscuro',
};

interface AppearanceSelectorProps {
  mode: ThemeMode;
  onModeChange: (mode: ThemeMode) => void;
}

export const AppearanceSelector = React.memo(function AppearanceSelector({
  mode,
  onModeChange,
}: AppearanceSelectorProps) {
  return (
    <View className="border-border bg-card mb-4 rounded-xl border p-4">
      <Text style={TYPE.titleSm} className="text-foreground mb-3">
        Apariencia
      </Text>
      <View className="gap-2">
        {(['auto', 'light', 'dark'] as const).map((option) => (
          <Pressable
            key={option}
            accessibilityRole="radio"
            accessibilityLabel={THEME_LABELS[option]}
            accessibilityState={{ selected: mode === option }}
            onPress={() => {
              onModeChange(option);
              haptics.selection();
            }}
            className={`flex-row items-center justify-between rounded-lg p-3 ${mode === option ? 'bg-primary/10' : 'bg-muted/50'}`}
          >
            <Text style={TYPE.bodyMd} className="text-foreground">
              {THEME_LABELS[option]}
            </Text>
            {mode === option && <View className="bg-primary h-3 w-3 rounded-full" />}
          </Pressable>
        ))}
      </View>
    </View>
  );
});
