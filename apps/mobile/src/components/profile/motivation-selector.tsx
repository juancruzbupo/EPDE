import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { TYPE } from '@/lib/fonts';
import { haptics } from '@/lib/haptics';
import type { MotivationStyle } from '@/stores/motivation-store';

const OPTIONS: { key: MotivationStyle; label: string; description: string; emoji: string }[] = [
  {
    key: 'rewards',
    label: 'Celebraciones',
    description: 'Confetti al completar tareas, mensajes motivacionales, desafíos semanales.',
    emoji: '🎉',
  },
  {
    key: 'minimal',
    label: 'Solo datos',
    description: 'Confirmaciones neutras. Sin confetti ni animaciones extras.',
    emoji: '📊',
  },
];

interface MotivationSelectorProps {
  motivationStyle: MotivationStyle;
  onMotivationStyleChange: (style: MotivationStyle) => void;
}

export const MotivationSelector = React.memo(function MotivationSelector({
  motivationStyle,
  onMotivationStyleChange,
}: MotivationSelectorProps) {
  return (
    <View className="border-border bg-card mb-4 rounded-xl border p-4">
      <Text style={TYPE.titleSm} className="text-foreground mb-1">
        Estilo de la app
      </Text>
      <Text style={TYPE.bodySm} className="text-muted-foreground mb-3">
        Elegí cómo querés que la app responda cuando completás tareas.
      </Text>
      <View className="gap-2">
        {OPTIONS.map((opt) => {
          const selected = motivationStyle === opt.key;
          return (
            <Pressable
              key={opt.key}
              accessibilityRole="radio"
              accessibilityLabel={opt.label}
              accessibilityState={{ selected }}
              onPress={() => {
                onMotivationStyleChange(opt.key);
                haptics.selection();
              }}
              className={`flex-row items-start gap-3 rounded-lg p-3 ${
                selected ? 'bg-primary/10' : 'bg-muted/50'
              }`}
            >
              <Text style={TYPE.titleLg} aria-hidden>
                {opt.emoji}
              </Text>
              <View className="flex-1">
                <Text style={TYPE.bodyMd} className="text-foreground">
                  {opt.label}
                </Text>
                <Text style={TYPE.bodySm} className="text-muted-foreground leading-snug">
                  {opt.description}
                </Text>
              </View>
              {selected && <View className="bg-primary mt-1 h-3 w-3 rounded-full" />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
});
