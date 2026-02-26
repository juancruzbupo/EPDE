import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { setPassword } from '@/lib/auth';

const schema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
      .regex(/[a-z]/, 'Debe contener al menos una minúscula')
      .regex(/[0-9]/, 'Debe contener al menos un número'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

export default function SetPasswordScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token: string }>();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  async function onSubmit(data: FormData) {
    if (!token) {
      setError('Token no encontrado.');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      await setPassword(token, data.newPassword);
      router.replace('/(auth)/login');
    } catch {
      setError('Token inválido o expirado.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="bg-background flex-1"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        className="px-6"
      >
        <Text
          style={{ fontFamily: 'PlayfairDisplay_700Bold' }}
          className="text-primary mb-2 text-center text-3xl"
        >
          Configurar Contraseña
        </Text>
        <Text
          style={{ fontFamily: 'DMSans_400Regular' }}
          className="text-muted-foreground mb-10 text-center text-base"
        >
          Creá tu contraseña para acceder a EPDE
        </Text>

        <View className="bg-card border-border rounded-xl border p-6">
          <Text
            style={{ fontFamily: 'DMSans_500Medium' }}
            className="text-foreground mb-1.5 text-sm"
          >
            Nueva Contraseña
          </Text>
          <Controller
            control={control}
            name="newPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className="bg-background border-border text-foreground mb-1 rounded-lg border px-4 py-3 text-base"
                style={{ fontFamily: 'DMSans_400Regular' }}
                placeholder="••••••••"
                placeholderTextColor="#4a4542"
                secureTextEntry
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
          {errors.newPassword && (
            <Text className="text-destructive mb-2 text-xs">{errors.newPassword.message}</Text>
          )}

          <Text
            style={{ fontFamily: 'DMSans_500Medium' }}
            className="text-foreground mt-3 mb-1.5 text-sm"
          >
            Confirmar Contraseña
          </Text>
          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className="bg-background border-border text-foreground mb-1 rounded-lg border px-4 py-3 text-base"
                style={{ fontFamily: 'DMSans_400Regular' }}
                placeholder="••••••••"
                placeholderTextColor="#4a4542"
                secureTextEntry
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
          {errors.confirmPassword && (
            <Text className="text-destructive mb-2 text-xs">{errors.confirmPassword.message}</Text>
          )}

          {error && <Text className="text-destructive mt-2 text-center text-sm">{error}</Text>}

          <Pressable
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading}
            className="bg-primary mt-5 items-center rounded-lg py-3.5 active:opacity-80"
            style={{ opacity: isLoading ? 0.6 : 1 }}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text
                style={{ fontFamily: 'DMSans_700Bold' }}
                className="text-primary-foreground text-base"
              >
                Configurar Contraseña
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
