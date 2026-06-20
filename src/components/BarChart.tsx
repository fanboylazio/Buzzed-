/**
 * Gráfica de barras sencilla (sin librerías de charting pesadas) usando SVG.
 * Pensada para "evolución por día" en las estadísticas personales.
 *
 * Nota de producto: es un registro informativo, NO un marcador competitivo.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { colors, spacing, fontSize } from '@/theme/colors';

export interface BarDatum {
  label: string; // etiqueta corta bajo la barra (p. ej. "L", "M"...)
  value: number;
}

interface BarChartProps {
  data: BarDatum[];
  height?: number;
}

function BarChartBase({ data, height = 150 }: BarChartProps) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const labelSpace = 18; // hueco superior para el valor
  const barAreaHeight = height - 24 - labelSpace;

  return (
    <View>
      <Svg width="100%" height={height}>
        {data.map((d, i) => {
          const barWidthPct = 100 / data.length;
          const barHeight = (d.value / max) * barAreaHeight;
          const x = `${i * barWidthPct + barWidthPct * 0.2}%`;
          const cx = `${i * barWidthPct + barWidthPct * 0.5}%`;
          const w = `${barWidthPct * 0.6}%`;
          const y = labelSpace + barAreaHeight - barHeight;
          return (
            <React.Fragment key={i}>
              {/* Valor encima de la barra (solo si hay datos) */}
              {d.value > 0 ? (
                <SvgText
                  x={cx}
                  y={y - 5}
                  fill={colors.textMuted}
                  fontSize={11}
                  fontWeight="700"
                  textAnchor="middle"
                >
                  {d.value}
                </SvgText>
              ) : null}
              <Rect
                x={x}
                y={y}
                width={w}
                height={Math.max(barHeight, 2)}
                rx={4}
                fill={d.value > 0 ? colors.primary : colors.border}
              />
            </React.Fragment>
          );
        })}
      </Svg>
      <View style={styles.labels}>
        {data.map((d, i) => (
          <Text key={i} style={styles.label} numberOfLines={1}>
            {d.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

// Memoizada: la serie cambia poco, evitamos repintar el SVG sin necesidad.
export const BarChart = React.memo(BarChartBase);

const styles = StyleSheet.create({
  labels: {
    flexDirection: 'row',
    marginTop: spacing.xs,
  },
  label: {
    flex: 1,
    textAlign: 'center',
    color: colors.textFaint,
    fontSize: fontSize.xs,
  },
});
