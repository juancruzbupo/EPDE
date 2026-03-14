import { memo } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Polygon, Polyline, Text as SvgText } from 'react-native-svg';

import { CHART_COLORS } from '@/lib/chart-colors';

interface MiniTrendChartProps {
  data: Array<{ label: string; value: number }>;
  height?: number;
  color?: string;
}

const PADDING_LEFT = 8;
const PADDING_RIGHT = 8;
const PADDING_TOP = 12;
const LABEL_AREA = 24;

export const MiniTrendChart = memo(function MiniTrendChart({
  data,
  height = 120,
  color = CHART_COLORS[0],
}: MiniTrendChartProps) {
  if (data.length === 0) {
    return null;
  }

  const totalWidth = 300;
  const chartHeight = height - LABEL_AREA - PADDING_TOP;
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const minValue = Math.min(...data.map((d) => d.value), 0);
  const range = maxValue - minValue || 1;

  const usableWidth = totalWidth - PADDING_LEFT - PADDING_RIGHT;
  const stepX = data.length > 1 ? usableWidth / (data.length - 1) : 0;

  const points = data.map((d, i) => {
    const x = PADDING_LEFT + i * stepX;
    const y = PADDING_TOP + chartHeight - ((d.value - minValue) / range) * chartHeight;
    return { x, y };
  });

  const linePoints = points.map((p) => `${p.x},${p.y}`).join(' ');

  // Fill polygon: line points + bottom-right + bottom-left
  const fillPoints = [
    ...points.map((p) => `${p.x},${p.y}`),
    `${points[points.length - 1].x},${PADDING_TOP + chartHeight}`,
    `${points[0].x},${PADDING_TOP + chartHeight}`,
  ].join(' ');

  return (
    <View className="items-center">
      <Svg width={totalWidth} height={height} viewBox={`0 0 ${totalWidth} ${height}`}>
        {/* Fill area */}
        <Polygon points={fillPoints} fill={color} opacity={0.1} />

        {/* Line */}
        <Polyline
          points={linePoints}
          stroke={color}
          strokeWidth={2}
          fill="none"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Dots */}
        {points.map((p, i) => (
          <Circle key={`dot-${data[i].label}`} cx={p.x} cy={p.y} r={3} fill={color} />
        ))}

        {/* X-axis labels */}
        {data.map((d, i) => (
          <SvgText
            key={`label-${d.label}`}
            x={points[i].x}
            y={height - 4}
            textAnchor="middle"
            fill="#666"
            fontSize={10}
            fontFamily="DMSans_500Medium"
          >
            {d.label}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
});
