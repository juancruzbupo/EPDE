import { memo, useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';

import { TIMING, useReducedMotion } from '@/lib/animations';
import { CHART_COLORS } from '@/lib/chart-colors';
import { COLORS } from '@/lib/colors';
import { TYPE } from '@/lib/fonts';

const AnimatedRect = Animated.createAnimatedComponent(Rect);

interface MiniBarChartProps {
  data: Array<{ label: string; value: number }>;
  height?: number;
}

const BAR_COLOR = CHART_COLORS[0];
const LABEL_AREA = 24;
const TOP_PADDING = 8;

const BarSegment = memo(function BarSegment({
  x,
  barWidth,
  barHeight,
  chartHeight,
  reduced,
  delay,
}: {
  x: number;
  barWidth: number;
  barHeight: number;
  chartHeight: number;
  reduced: boolean;
  delay: number;
}) {
  const animProgress = useSharedValue(reduced ? 1 : 0);

  useEffect(() => {
    if (reduced) {
      animProgress.value = 1;
      return;
    }
    const timeout = setTimeout(() => {
      animProgress.value = withTiming(1, {
        duration: TIMING.slow,
        easing: Easing.out(Easing.quad),
      });
    }, delay);
    return () => clearTimeout(timeout);
  }, [reduced, delay, animProgress]);

  const animatedProps = useAnimatedProps(() => {
    const currentHeight = barHeight * animProgress.value;
    return {
      y: chartHeight - currentHeight,
      height: currentHeight,
    };
  });

  return (
    <AnimatedRect x={x} width={barWidth} rx={3} fill={BAR_COLOR} animatedProps={animatedProps} />
  );
});

export const MiniBarChart = memo(function MiniBarChart({ data, height = 150 }: MiniBarChartProps) {
  const reduced = useReducedMotion();
  const allZero = data.every((d) => d.value === 0);

  if (data.length === 0 || allZero) {
    return (
      <View className="items-center justify-center" style={{ height }}>
        <Text style={TYPE.bodySm} className="text-muted-foreground">
          Sin gastos registrados
        </Text>
      </View>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value));
  const chartHeight = height - LABEL_AREA - TOP_PADDING;
  const barPadding = 6;
  const totalWidth = 300;
  const barWidth = Math.max(8, (totalWidth - barPadding * (data.length + 1)) / data.length);

  return (
    <View className="items-center">
      <Svg width={totalWidth} height={height} viewBox={`0 0 ${totalWidth} ${height}`}>
        {data.map((d, i) => {
          const x = barPadding + i * (barWidth + barPadding);
          const barHeight = maxValue > 0 ? (d.value / maxValue) * chartHeight : 0;

          return (
            <BarSegment
              key={d.label}
              x={x}
              barWidth={barWidth}
              barHeight={barHeight}
              chartHeight={chartHeight + TOP_PADDING}
              reduced={reduced}
              delay={i * 50}
            />
          );
        })}

        {/* X-axis labels */}
        {data.map((d, i) => {
          const x = barPadding + i * (barWidth + barPadding) + barWidth / 2;
          return (
            <SvgText
              key={`label-${d.label}`}
              x={x}
              y={height - 4}
              textAnchor="middle"
              fill={COLORS.mutedForeground}
              fontSize={12}
              fontFamily="DMSans_500Medium"
            >
              {d.label}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
});
