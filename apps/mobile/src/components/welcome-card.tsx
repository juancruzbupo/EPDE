import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { TYPE } from '@/lib/fonts';
import { ROUTES } from '@/lib/routes';

interface WelcomeCardProps {
  userName: string;
  hasProperties: boolean;
  hasActivePlan: boolean;
  hasCompletedTasks?: boolean;
}

export function WelcomeCard({
  userName,
  hasProperties,
  hasActivePlan,
  hasCompletedTasks,
}: WelcomeCardProps) {
  const router = useRouter();

  const steps = [
    { label: 'Tu propiedad fue registrada por EPDE', done: hasProperties },
    {
      label: 'La arquitecta inspecciona tu casa y crea el plan (puede tardar unos días)',
      done: hasActivePlan,
    },
    { label: 'Cuando el plan esté activo, completá tu primera tarea', done: !!hasCompletedTasks },
  ];

  const completedSteps = steps.filter((s) => s.done).length;

  return (
    <View className="border-primary/20 bg-primary/5 mb-4 rounded-xl border p-4">
      <Text style={TYPE.titleMd} className="text-foreground mb-1">
        Bienvenido/a, {userName}
      </Text>
      <Text style={TYPE.bodySm} className="text-muted-foreground mb-3">
        Tu sistema de mantenimiento preventivo está siendo configurado.
      </Text>

      <View className="mb-3 gap-2">
        {steps.map((step) => (
          <View key={step.label} className="flex-row items-center gap-2">
            <Text className={step.done ? 'text-success' : 'text-muted-foreground'}>
              {step.done ? '✓' : '○'}
            </Text>
            <Text
              style={TYPE.bodySm}
              className={step.done ? 'text-muted-foreground line-through' : 'text-foreground'}
            >
              {step.label}
            </Text>
          </View>
        ))}
      </View>

      <Text style={TYPE.labelMd} className="text-muted-foreground mb-3">
        {completedSteps} de {steps.length} completados
      </Text>

      {hasProperties && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ver mi propiedad"
          className="bg-primary items-center rounded-lg px-4 py-2.5"
          onPress={() => router.push(ROUTES.properties as never)}
        >
          <Text style={TYPE.labelMd} className="text-primary-foreground">
            Ver mi propiedad
          </Text>
        </Pressable>
      )}
    </View>
  );
}
