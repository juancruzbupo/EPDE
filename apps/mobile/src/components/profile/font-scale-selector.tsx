import { FONT_SCALE_LABELS, FONT_SCALE_VALUES, type FontScale } from '@epde/shared';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { TYPE } from '@/lib/fonts';
import { haptics } from '@/lib/haptics';

interface FontScaleSelectorProps {
  fontScale: FontScale;
  onFontScaleChange: (scale: FontScale) => void;
}

/**
 * Tamaño de texto selector. Mirrors web's equivalent in profile/page.tsx.
 * The "Aa" preview on each option renders with that scale multiplier
 * applied to `TYPE.titleLg` so the user sees the effect before tapping.
 * The live main app re-renders through `useType()` consumers as soon as
 * the store mutates.
 */
export const FontScaleSelector = React.memo(function FontScaleSelector({
  fontScale,
  onFontScaleChange,
}: FontScaleSelectorProps) {
  return (
    <View className="border-border bg-card mb-4 rounded-xl border p-4">
      <Text style={TYPE.titleSm} className="text-foreground mb-1">
        Tamaño de texto
      </Text>
      <Text style={TYPE.bodySm} className="text-muted-foreground mb-3">
        Afecta el texto de toda la app. Ajustalo si te cuesta leer.
      </Text>
      <View className="gap-2">
        {(['sm', 'base', 'lg', 'xl'] as const).map((option) => {
          const multiplier = FONT_SCALE_VALUES[option];
          const selected = fontScale === option;
          return (
            <Pressable
              key={option}
              accessibilityRole="radio"
              accessibilityLabel={`Tamaño ${FONT_SCALE_LABELS[option]}`}
              accessibilityState={{ selected }}
              onPress={() => {
                onFontScaleChange(option);
                haptics.selection();
              }}
              className={`flex-row items-center justify-between rounded-lg p-3 ${
                selected ? 'bg-primary/10' : 'bg-muted/50'
              }`}
            >
              <View className="flex-row items-center gap-3">
                <Text
                  style={{
                    ...TYPE.titleLg,
                    fontSize: Math.round(TYPE.titleLg.fontSize * multiplier),
                    lineHeight: Math.round(TYPE.titleLg.lineHeight * multiplier),
                  }}
                  className="text-foreground w-10"
                >
                  Aa
                </Text>
                <Text style={TYPE.bodyMd} className="text-foreground">
                  {FONT_SCALE_LABELS[option]}
                </Text>
              </View>
              {selected && <View className="bg-primary h-3 w-3 rounded-full" />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
});
