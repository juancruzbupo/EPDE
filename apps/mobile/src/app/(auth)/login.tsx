import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '@epde/shared';
import type { LoginInput } from '@epde/shared';
import { useAuthStore } from '@/stores/auth-store';

export default function LoginScreen() {
  const login = useAuthStore((s) => s.login);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(data: LoginInput) {
    setError(null);
    setIsLoading(true);
    try {
      await login(data.email, data.password);
    } catch {
      setError('Credenciales inválidas. Verificá tu email y contraseña.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="bg-background flex-1"
    >
      <View className="flex-1 justify-center px-6">
        <Text
          style={{ fontFamily: 'PlayfairDisplay_700Bold' }}
          className="text-primary mb-2 text-center text-4xl"
        >
          EPDE
        </Text>
        <Text
          style={{ fontFamily: 'DMSans_400Regular' }}
          className="text-muted-foreground mb-10 text-center text-base"
        >
          Ingresá a tu cuenta
        </Text>

        <View className="bg-card border-border rounded-xl border p-6">
          <Text
            style={{ fontFamily: 'DMSans_500Medium' }}
            className="text-foreground mb-1.5 text-sm"
          >
            Email
          </Text>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className="bg-background border-border text-foreground mb-1 rounded-lg border px-4 py-3 text-base"
                style={{ fontFamily: 'DMSans_400Regular' }}
                placeholder="tu@email.com"
                placeholderTextColor="#4a4542"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
          {errors.email && (
            <Text className="text-destructive mb-2 text-xs">{errors.email.message}</Text>
          )}

          <Text
            style={{ fontFamily: 'DMSans_500Medium' }}
            className="text-foreground mt-3 mb-1.5 text-sm"
          >
            Contraseña
          </Text>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className="bg-background border-border text-foreground mb-1 rounded-lg border px-4 py-3 text-base"
                style={{ fontFamily: 'DMSans_400Regular' }}
                placeholder="••••••"
                placeholderTextColor="#4a4542"
                secureTextEntry
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
          {errors.password && (
            <Text className="text-destructive mb-2 text-xs">{errors.password.message}</Text>
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
                Ingresar
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
