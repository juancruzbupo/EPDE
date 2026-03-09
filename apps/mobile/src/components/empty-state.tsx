import { memo } from 'react';
import { Text, View } from 'react-native';

import { TYPE } from '@/lib/fonts';

interface EmptyStateProps {
  title: string;
  message: string;
}

export const EmptyState = memo(function EmptyState({ title, message }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center p-8">
      <Text style={TYPE.titleLg} className="text-foreground mb-2">
        {title}
      </Text>
      <Text style={TYPE.bodyMd} className="text-muted-foreground text-center">
        {message}
      </Text>
    </View>
  );
});
