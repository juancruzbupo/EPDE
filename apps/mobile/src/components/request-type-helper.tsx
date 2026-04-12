import { useRouter } from 'expo-router';
import { memo } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

import { TYPE } from '@/lib/fonts';

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
            router.push('/budget' as never);
          }}
          accessibilityRole="button"
          accessibilityLabel="Solicitar presupuesto"
        >
          <Text style={TYPE.titleMd} className="text-foreground mb-1">
            📋 Pedir cotización
          </Text>
          <Text style={TYPE.bodySm} className="text-muted-foreground mb-2 leading-5">
            Sabés qué reparación necesitás y querés saber cuánto cuesta.
          </Text>
          <Text style={TYPE.bodySm} className="text-muted-foreground italic">
            Ejemplo: &ldquo;Las canaletas están rotas, ¿cuánto sale repararlas?&rdquo;
          </Text>
        </Pressable>

        <Pressable
          className="border-border bg-card rounded-xl border p-4"
          style={{ minHeight: 44 }}
          onPress={() => {
            onClose();
            router.push('/service-requests' as never);
          }}
          accessibilityRole="button"
          accessibilityLabel="Crear solicitud de servicio"
        >
          <Text style={TYPE.titleMd} className="text-foreground mb-1">
            🔧 Reportar un problema
          </Text>
          <Text style={TYPE.bodySm} className="text-muted-foreground mb-2 leading-5">
            Detectaste algo raro y necesitás que EPDE lo eval��e y te diga qué hacer.
          </Text>
          <Text style={TYPE.bodySm} className="text-muted-foreground italic">
            Ejemplo: &ldquo;Hay humedad en la pared, no sé de dónde viene.&rdquo;
          </Text>
        </Pressable>
      </View>
    </Modal>
  );
});
