import { memo } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';

import { TYPE } from '@/lib/fonts';

interface ContextualEmptyStateProps {
  icon: string;
  title: string;
  message: string;
  action?: {
    label: string;
    url?: string;
    onPress?: () => void;
  };
}

export const ContextualEmptyState = memo(function ContextualEmptyState({
  icon,
  title,
  message,
  action,
}: ContextualEmptyStateProps) {
  const handleAction = () => {
    if (action?.url) {
      void Linking.openURL(action.url);
    } else {
      action?.onPress?.();
    }
  };

  return (
    <View className="flex-1 items-center justify-center p-8" accessibilityLiveRegion="polite">
      <Text className="mb-3 text-3xl">{icon}</Text>
      <Text style={TYPE.titleMd} className="text-foreground mb-1 text-center">
        {title}
      </Text>
      <Text style={TYPE.bodySm} className="text-muted-foreground mb-4 text-center leading-5">
        {message}
      </Text>
      {action && (
        <Pressable
          onPress={handleAction}
          className="bg-primary/10 rounded-full px-5 py-2.5"
          style={{ minHeight: 44 }}
          accessibilityRole="button"
          accessibilityLabel={action.label}
        >
          <Text style={TYPE.labelMd} className="text-primary">
            {action.label}
          </Text>
        </Pressable>
      )}
    </View>
  );
});
