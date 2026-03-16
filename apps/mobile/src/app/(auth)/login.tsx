import type { LoginInput } from '@epde/shared';
import { loginSchema } from '@epde/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';

import { COLORS } from '@/lib/colors';
import { TYPE } from '@/lib/fonts';
import { useAuthStore } from '@/stores/auth-store';

export default function LoginScreen() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
        <Text style={TYPE.displayLg} className="text-primary mb-2 text-center">
          EPDE
        </Text>
        <Text style={TYPE.bodyLg} className="text-muted-foreground mb-10 text-center">
          Ingresá a tu cuenta
        </Text>

        <View className="bg-card border-border rounded-xl border p-6">
          <Text style={TYPE.labelLg} className="text-foreground mb-1.5">
            Email *
          </Text>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className="bg-background border-border text-foreground mb-1 rounded-lg border px-4 py-3"
                style={TYPE.bodyLg}
                placeholder="tu@email.com"
                placeholderTextColor={COLORS.mutedForeground}
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

          <Text style={TYPE.labelLg} className="text-foreground mt-3 mb-1.5">
            Contraseña *
          </Text>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <View className="relative">
                <TextInput
                  className="bg-background border-border text-foreground mb-1 rounded-lg border px-4 py-3 pr-12"
                  style={TYPE.bodyLg}
                  placeholder="••••••"
                  placeholderTextColor={COLORS.mutedForeground}
                  secureTextEntry={!showPassword}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
                  className="absolute top-3 right-3"
                  hitSlop={8}
                >
                  <Text className="text-muted-foreground text-sm">
                    {showPassword ? 'Ocultar' : 'Mostrar'}
                  </Text>
                </Pressable>
              </View>
            )}
          />
          {errors.password && (
            <Text className="text-destructive mb-2 text-xs">{errors.password.message}</Text>
          )}

          <Pressable
            onPress={() => router.push('/(auth)/forgot-password')}
            className="mt-2 self-end"
          >
            <Text style={TYPE.labelMd} className="text-primary">
              ¿Olvidaste tu contraseña?
            </Text>
          </Pressable>

          {error && <Text className="text-destructive mt-2 text-center text-sm">{error}</Text>}

          <Pressable
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading}
            className="bg-primary mt-5 items-center rounded-lg py-3.5 active:opacity-80"
            style={{ opacity: isLoading ? 0.6 : 1 }}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.primaryForeground} />
            ) : (
              <Text style={TYPE.titleMd} className="text-primary-foreground">
                Ingresar
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
