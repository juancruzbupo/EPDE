import { View, Text, Pressable } from 'react-native';
import { TYPE } from '@/lib/fonts';

interface ErrorStateProps {
  onRetry?: () => void;
  message?: string;
}

export function ErrorState({ onRetry, message }: ErrorStateProps) {
  return (
    <View className="flex-1 items-center justify-center p-8">
      <Text style={TYPE.titleLg} className="text-foreground mb-2">
        Error al cargar
      </Text>
      <Text style={TYPE.bodyMd} className="text-muted-foreground mb-4 text-center">
        {message ?? 'No se pudieron cargar los datos. Intentá de nuevo.'}
      </Text>
      {onRetry && (
        <Pressable onPress={onRetry} className="bg-primary rounded-xl px-6 py-3">
          <Text style={TYPE.titleSm} className="text-primary-foreground">
            Reintentar
          </Text>
        </Pressable>
      )}
    </View>
  );
}
