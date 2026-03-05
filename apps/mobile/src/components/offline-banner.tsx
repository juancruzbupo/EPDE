import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { fonts } from '@/lib/fonts';

export function OfflineBanner() {
  const isConnected = useNetworkStatus();
  const insets = useSafeAreaInsets();

  if (isConnected) return null;

  return (
    <View style={{ paddingTop: insets.top }} className="bg-warning items-center pb-2">
      <Text style={fonts.medium} className="text-sm text-white">
        Sin conexion a internet
      </Text>
    </View>
  );
}
