import { View, Text, Pressable } from 'react-native';
import { fonts } from '@/lib/fonts';

interface ErrorStateProps {
  onRetry?: () => void;
  message?: string;
}

export function ErrorState({ onRetry, message }: ErrorStateProps) {
  return (
    <View className="flex-1 items-center justify-center p-8">
      <Text style={fonts.bold} className="text-foreground mb-2 text-lg">
        Error al cargar
      </Text>
      <Text style={fonts.regular} className="text-muted-foreground mb-4 text-center text-sm">
        {message ?? 'No se pudieron cargar los datos. Intentá de nuevo.'}
      </Text>
      {onRetry && (
        <Pressable onPress={onRetry} className="bg-primary rounded-xl px-6 py-3">
          <Text style={fonts.bold} className="text-primary-foreground text-sm">
            Reintentar
          </Text>
        </Pressable>
      )}
    </View>
  );
}
