import { View, Text } from 'react-native';

interface EmptyStateProps {
  title: string;
  message: string;
}

export function EmptyState({ title, message }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center p-8">
      <Text style={{ fontFamily: 'DMSans_700Bold' }} className="text-foreground mb-2 text-lg">
        {title}
      </Text>
      <Text
        style={{ fontFamily: 'DMSans_400Regular' }}
        className="text-muted-foreground text-center text-sm"
      >
        {message}
      </Text>
    </View>
  );
}
