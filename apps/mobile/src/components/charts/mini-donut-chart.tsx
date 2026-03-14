import type { ConditionDistribution } from '@epde/shared';
import { memo } from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, G, Text as SvgText } from 'react-native-svg';

import { CONDITION_COLORS, CONDITION_LABELS } from '@/lib/chart-colors';
import { TYPE } from '@/lib/fonts';

interface MiniDonutChartProps {
  data: ConditionDistribution[];
  size?: number;
}

export const MiniDonutChart = memo(function MiniDonutChart({
  data,
  size = 160,
}: MiniDonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  if (total === 0) {
    return (
      <View className="items-center py-4">
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={size / 2 - 20}
            stroke="#e5e5e5"
            strokeWidth={16}
            fill="none"
          />
          <SvgText
            x={size / 2}
            y={size / 2 + 5}
            textAnchor="middle"
            fill="#999"
            fontSize={14}
            fontFamily="DMSans_500Medium"
          >
            Sin datos
          </SvgText>
        </Svg>
      </View>
    );
  }

  const okCount = data
    .filter((d) => d.condition === 'EXCELLENT' || d.condition === 'GOOD')
    .reduce((sum, d) => sum + d.count, 0);
  const okPercent = Math.round((okCount / total) * 100);

  const radius = size / 2 - 20;
  const circumference = 2 * Math.PI * radius;
  let cumulativeOffset = 0;

  const segments = data
    .filter((d) => d.count > 0)
    .map((d) => {
      const fraction = d.count / total;
      const dashLength = fraction * circumference;
      const gap = circumference - dashLength;
      const offset = -cumulativeOffset + circumference * 0.25;
      cumulativeOffset += dashLength;

      return {
        condition: d.condition,
        color: CONDITION_COLORS[d.condition] ?? '#999',
        dashArray: `${dashLength} ${gap}`,
        dashOffset: offset,
        count: d.count,
      };
    });

  return (
    <View className="items-center">
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <G>
          {segments.map((seg) => (
            <Circle
              key={seg.condition}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={seg.color}
              strokeWidth={16}
              fill="none"
              strokeDasharray={seg.dashArray}
              strokeDashoffset={seg.dashOffset}
              strokeLinecap="butt"
            />
          ))}
        </G>
        <SvgText
          x={size / 2}
          y={size / 2 - 4}
          textAnchor="middle"
          fill="#1a1a1a"
          fontSize={24}
          fontWeight="bold"
          fontFamily="DMSans_700Bold"
        >
          {okPercent}%
        </SvgText>
        <SvgText
          x={size / 2}
          y={size / 2 + 16}
          textAnchor="middle"
          fill="#666"
          fontSize={12}
          fontFamily="DMSans_500Medium"
        >
          OK
        </SvgText>
      </Svg>

      {/* Legend */}
      <View className="mt-3 flex-row flex-wrap justify-center gap-x-4 gap-y-1">
        {data
          .filter((d) => d.count > 0)
          .map((d) => (
            <View key={d.condition} className="flex-row items-center gap-1">
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: CONDITION_COLORS[d.condition] ?? '#999',
                }}
              />
              <Text style={TYPE.labelSm} className="text-muted-foreground">
                {CONDITION_LABELS[d.condition] ?? d.condition} ({d.count})
              </Text>
            </View>
          ))}
      </View>
    </View>
  );
});
