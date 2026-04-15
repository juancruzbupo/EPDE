import { memo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { TYPE } from '@/lib/fonts';

interface HelpHintProps {
  term: string;
  children: string;
}

/**
 * Inline expandable help. Tap the "?" icon to expand/collapse the explanation
 * directly below. Uses expand/collapse instead of a floating popover because
 * React Native popovers are fragile across devices and keyboard states.
 */
export const HelpHint = memo(function HelpHint({ term, children }: HelpHintProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View>
      <Pressable
        onPress={() => setExpanded((v) => !v)}
        hitSlop={14}
        accessibilityRole="button"
        accessibilityLabel={`Ayuda sobre ${term}`}
        accessibilityHint={expanded ? 'Toca para cerrar' : 'Toca para ver explicación'}
      >
        <Text className="text-muted-foreground text-base">ⓘ</Text>
      </Pressable>
      {expanded && (
        <Animated.View
          entering={FadeIn.duration(150)}
          exiting={FadeOut.duration(100)}
          className="bg-muted/50 mt-1 rounded-lg px-3 py-2"
        >
          <Text style={TYPE.labelMd} className="text-foreground mb-0.5">
            {term}
          </Text>
          <Text style={TYPE.bodySm} className="text-muted-foreground leading-5">
            {children}
          </Text>
        </Animated.View>
      )}
    </View>
  );
});
