import { View, Text, Pressable } from 'react-native';

interface ErrorStateProps {
  onRetry?: () => void;
  message?: string;
}

export function ErrorState({ onRetry, message }: ErrorStateProps) {
  return (
    <View className="flex-1 items-center justify-center p-8">
      <Text style={{ fontFamily: 'DMSans_700Bold' }} className="text-foreground mb-2 text-lg">
        Error al cargar
      </Text>
      <Text
        style={{ fontFamily: 'DMSans_400Regular' }}
        className="text-muted-foreground mb-4 text-center text-sm"
      >
        {message ?? 'No se pudieron cargar los datos. Intentá de nuevo.'}
      </Text>
      {onRetry && (
        <Pressable onPress={onRetry} className="bg-primary rounded-xl px-6 py-3">
          <Text
            style={{ fontFamily: 'DMSans_600SemiBold' }}
            className="text-primary-foreground text-sm"
          >
            Reintentar
          </Text>
        </Pressable>
      )}
    </View>
  );
}
