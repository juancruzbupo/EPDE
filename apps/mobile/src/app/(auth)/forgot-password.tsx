import { type ForgotPasswordInput, forgotPasswordSchema } from '@epde/shared';
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

import { forgotPassword } from '@/lib/auth';
import { COLORS } from '@/lib/colors';
import { TYPE } from '@/lib/fonts';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  async function onSubmit(data: ForgotPasswordInput) {
    setError(null);
    setIsLoading(true);
    try {
      await forgotPassword(data.email);
      setSubmitted(true);
    } catch {
      setError('Ocurrió un error. Intentá nuevamente.');
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
          Recuperar Contraseña
        </Text>
        <Text style={TYPE.bodyLg} className="text-muted-foreground mb-10 text-center">
          Ingresá tu email y te enviaremos instrucciones
        </Text>

        <View className="bg-card border-border rounded-xl border p-6">
          {submitted ? (
            <View className="items-center space-y-4">
              <Text style={TYPE.bodyMd} className="text-muted-foreground text-center">
                Si el email está registrado, recibirás instrucciones para restablecer tu contraseña.
              </Text>
              <Pressable
                accessibilityRole="link"
                accessibilityLabel="Volver al inicio de sesión"
                onPress={() => router.back()}
                className="mt-4"
              >
                <Text style={TYPE.labelLg} className="text-primary text-center">
                  Volver al inicio de sesión
                </Text>
              </Pressable>
            </View>
          ) : (
            <>
              <Text style={TYPE.labelLg} className="text-foreground mb-1.5">
                Email
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

              {error && <Text className="text-destructive mt-2 text-center text-sm">{error}</Text>}

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Enviar instrucciones de recuperación"
                onPress={handleSubmit(onSubmit)}
                disabled={isLoading}
                className="bg-primary mt-5 items-center rounded-lg py-3.5 active:opacity-80"
                style={{ opacity: isLoading ? 0.6 : 1 }}
              >
                {isLoading ? (
                  <ActivityIndicator color={COLORS.primaryForeground} />
                ) : (
                  <Text style={TYPE.titleMd} className="text-primary-foreground">
                    Enviar instrucciones
                  </Text>
                )}
              </Pressable>

              <Pressable
                accessibilityRole="link"
                accessibilityLabel="Volver al inicio de sesión"
                onPress={() => router.back()}
                className="mt-4"
              >
                <Text style={TYPE.labelMd} className="text-primary text-center">
                  Volver al inicio de sesión
                </Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
