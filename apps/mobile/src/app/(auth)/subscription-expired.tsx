import { WHATSAPP_CONTACT_NUMBER } from '@epde/shared';
import { useRouter } from 'expo-router';
import { Linking, Pressable, Text, View } from 'react-native';

import { TYPE } from '@/lib/fonts';

export default function SubscriptionExpiredScreen() {
  const router = useRouter();

  return (
    <View className="bg-background flex-1 items-center justify-center px-6">
      <View className="bg-destructive/10 mb-6 h-16 w-16 items-center justify-center rounded-full">
        <Text style={{ fontSize: 32 }}>⏱</Text>
      </View>
      <Text style={TYPE.titleLg} className="text-foreground mb-2 text-center">
        Tu suscripción expiró
      </Text>
      <Text style={TYPE.bodyMd} className="text-muted-foreground mb-8 text-center">
        Tu período de acceso a EPDE finalizó. Para seguir usando la plataforma, contactá al
        administrador para renovar tu suscripción.
      </Text>
      <Pressable
        className="bg-primary w-full items-center rounded-xl py-3.5"
        onPress={() =>
          Linking.openURL(
            `https://wa.me/${WHATSAPP_CONTACT_NUMBER}?text=Hola, quiero renovar mi suscripción a EPDE`,
          )
        }
      >
        <Text style={TYPE.labelLg} className="text-primary-foreground">
          Contactar por WhatsApp
        </Text>
      </Pressable>
      <Pressable
        className="mt-3 w-full items-center py-3"
        onPress={() => router.replace('/(auth)/login')}
      >
        <Text style={TYPE.labelMd} className="text-muted-foreground">
          Volver al inicio
        </Text>
      </Pressable>
    </View>
  );
}
