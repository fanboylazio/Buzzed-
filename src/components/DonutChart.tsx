/**
 * Gráfica de anillo (donut) para mostrar la distribución por tipo.
 * Construida con react-native-svg, sin librerías de charting pesadas.
 *
 * Nota de producto: distribución INFORMATIVA, no un marcador competitivo.
 */
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { colors, fontSize } from '@/theme/colors';

export interface DonutSlice {
  label: string;
  value: number;
}

/** Paleta para los segmentos (se cicla si hay más tipos que colores). */
const PALETTE = ['#38BDF8', '#818CF8', '#34D399', '#FBBF24', '#F87171', '#F472B6'];

interface DonutChartProps {
  data: DonutSlice[];
  size?: number;
  strokeWidth?: number;
  /** Texto grande del centro (p. ej. el total). */
  centerValue?: string | number;
  centerLabel?: string;
}

export function DonutChart({
  data,
  size = 160,
  strokeWidth = 22,
  centerValue,
  centerLabel,
}: DonutChartProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = useMemo(() => data.reduce((acc, d) => acc + d.value, 0), [data]);

  // Pre-cálculo de segmentos (fracción y desfase acumulado).
  const segments = useMemo(() => {
    let acc = 0;
    return data
      .filter((d) => d.value > 0)
      .map((d, i) => {
        const fraction = total > 0 ? d.value / total : 0;
        const seg = {
          color: PALETTE[i % PALETTE.length],
          label: d.label,
          value: d.value,
          dash: fraction * circumference,
          offset: acc * circumference,
        };
        acc += fraction;
        return seg;
      });
  }, [data, total, circumference]);

  return (
    <View style={styles.container}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          {/* Rotamos -90º para empezar arriba. */}
          <G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
            {/* Aro de fondo */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={colors.surfaceAlt}
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Segmentos */}
            {segments.map((s, i) => (
              <Circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={s.color}
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeDasharray={`${s.dash} ${circumference - s.dash}`}
                strokeDashoffset={-s.offset}
                strokeLinecap="butt"
              />
            ))}
          </G>
        </Svg>
        {/* Centro */}
        {centerValue !== undefined ? (
          <View style={styles.center}>
            <Text style={styles.centerValue}>{centerValue}</Text>
            {centerLabel ? <Text style={styles.centerLabel}>{centerLabel}</Text> : null}
          </View>
        ) : null}
      </View>

      {/* Leyenda */}
      <View style={styles.legend}>
        {segments.map((s, i) => (
          <View key={i} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: s.color }]} />
            <Text style={styles.legendText} numberOfLines={1}>
              {s.label}
            </Text>
            <Text style={styles.legendValue}>{s.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerValue: {
    color: colors.text,
    fontSize: fontSize.xxl,
    fontWeight: '800',
  },
  centerLabel: {
    color: colors.textFaint,
    fontSize: fontSize.xs,
  },
  legend: {
    flex: 1,
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  legendValue: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
});
