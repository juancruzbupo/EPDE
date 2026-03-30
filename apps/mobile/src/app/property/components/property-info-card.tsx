import type { PropertyType } from '@epde/shared';
import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { PropertyTypeBadge } from '@/components/status-badge';
import { TYPE } from '@/lib/fonts';

interface PropertyInfoCardProps {
  address: string;
  type: PropertyType;
  city: string;
  yearBuilt: number | null;
  squareMeters: number | null;
  animatedStyle: StyleProp<ViewStyle>;
}

export const PropertyInfoCard = React.memo(function PropertyInfoCard({
  address,
  type,
  city,
  yearBuilt,
  squareMeters,
  animatedStyle,
}: PropertyInfoCardProps) {
  return (
    <Animated.View
      style={animatedStyle}
      className="border-border bg-card mb-4 rounded-xl border p-3"
    >
      <View className="mb-1 flex-row items-center justify-between">
        <Text style={TYPE.titleLg} className="text-foreground flex-1">
          {address}
        </Text>
        <PropertyTypeBadge type={type} />
      </View>
      <Text style={TYPE.bodySm} className="text-muted-foreground">
        {[city, yearBuilt && `${yearBuilt}`, squareMeters && `${squareMeters} m²`]
          .filter(Boolean)
          .join(' \u00b7 ')}
      </Text>
    </Animated.View>
  );
});
