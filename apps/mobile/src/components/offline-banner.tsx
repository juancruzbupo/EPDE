import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { TYPE } from '@/lib/fonts';

export function OfflineBanner() {
  const isConnected = useNetworkStatus();
  const insets = useSafeAreaInsets();

  if (isConnected) return null;

  return (
    <View style={{ paddingTop: insets.top }} className="bg-warning items-center pb-2">
      <Text style={TYPE.labelMd} className="text-white">
        Sin conexion a internet
      </Text>
    </View>
  );
}
