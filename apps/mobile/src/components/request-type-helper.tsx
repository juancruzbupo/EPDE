import { useRouter } from 'expo-router';
import { memo } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

import { TYPE } from '@/lib/fonts';
import { ROUTES } from '@/lib/routes';

interface RequestTypeHelperProps {
  visible: boolean;
  onClose: () => void;
}

export const RequestTypeHelper = memo(function RequestTypeHelper({
  visible,
  onClose,
}: RequestTypeHelperProps) {
  const router = useRouter();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="bg-background flex-1 px-4 pt-4">
        <View className="mb-6 flex-row items-center justify-between">
          <Text style={TYPE.titleLg} className="text-foreground">
            ¿Qué necesitás?
          </Text>
          <Pressable
            onPress={onClose}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Cerrar"
          >
            <Text style={TYPE.bodyLg} className="text-primary">
              Cerrar
            </Text>
          </Pressable>
        </View>
        <Text style={TYPE.bodySm} className="text-muted-foreground mb-6">
          Elegí la opción que mejor describe tu situación.
        </Text>

        <Pressable
          className="border-border bg-card mb-4 rounded-xl border p-4"
          style={{ minHeight: 44 }}
          onPress={() => {
            onClose();
            router.push(ROUTES.budget as never);
          }}
          accessibilityRole="button"
          accessibilityLabel="Solicitar presupuesto"
        >
          <Text style={TYPE.titleMd} className="text-foreground mb-1">
            📋 Presupuesto
          </Text>
          <Text style={TYPE.bodySm} className="text-muted-foreground mb-2 leading-5">
            Un trabajo de arquitectura fuera del mantenimiento: ampliación, renovación, plano
            municipal, habilitación.
          </Text>
          <Text style={TYPE.bodySm} className="text-muted-foreground italic">
            Ejemplo: &ldquo;Quiero ampliar la cocina, ¿cuánto sale?&rdquo;
          </Text>
        </Pressable>

        <Pressable
          className="border-border bg-card rounded-xl border p-4"
          style={{ minHeight: 44 }}
          onPress={() => {
            onClose();
            router.push(ROUTES.serviceRequests as never);
          }}
          accessibilityRole="button"
          accessibilityLabel="Crear solicitud de servicio"
        >
          <Text style={TYPE.titleMd} className="text-foreground mb-1">
            🔧 Solicitud de servicio
          </Text>
          <Text style={TYPE.bodySm} className="text-muted-foreground mb-2 leading-5">
            Pedí que EPDE ejecute una tarea de mantenimiento por vos. Algo del plan, algo que
            requiere profesional, o un problema nuevo.
          </Text>
          <Text style={TYPE.bodySm} className="text-muted-foreground italic">
            Ejemplo: &ldquo;Necesito que revisen la instalación eléctrica.&rdquo;
          </Text>
        </Pressable>
      </View>
    </Modal>
  );
});
