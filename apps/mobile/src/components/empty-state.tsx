import { memo } from 'react';
import { View, Text } from 'react-native';
import { fonts } from '@/lib/fonts';

interface EmptyStateProps {
  title: string;
  message: string;
}

export const EmptyState = memo(function EmptyState({ title, message }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center p-8">
      <Text style={fonts.bold} className="text-foreground mb-2 text-lg">
        {title}
      </Text>
      <Text style={fonts.regular} className="text-muted-foreground text-center text-sm">
        {message}
      </Text>
    </View>
  );
});
