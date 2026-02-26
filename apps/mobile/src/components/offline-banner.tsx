import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetworkStatus } from '@/hooks/use-network-status';

export function OfflineBanner() {
  const isConnected = useNetworkStatus();
  const insets = useSafeAreaInsets();

  if (isConnected) return null;

  return (
    <View style={{ paddingTop: insets.top }} className="items-center bg-yellow-600 pb-2">
      <Text style={{ fontFamily: 'DMSans_500Medium' }} className="text-sm text-white">
        Sin conexion a internet
      </Text>
    </View>
  );
}
