import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { colors } from '../constants/theme';
import { clamp } from '../utils/formatters';

type Props = {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
  sublabel?: string;
  color?: string;
};

export function ProgressRing({ value, size = 112, stroke = 10, label, sublabel, color = colors.accent }: Props) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = clamp(value, 0, 100);
  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle stroke={colors.surfaceAlt} fill="none" cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} />
        <Circle
          stroke={color}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference - (progress / 100) * circumference}
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={styles.center}>
        <Text style={styles.label}>{label ?? `${Math.round(progress)}%`}</Text>
        {sublabel ? <Text style={styles.sublabel}>{sublabel}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  center: {
    alignItems: 'center',
    position: 'absolute'
  },
  label: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800'
  },
  sublabel: {
    color: colors.textMuted,
    fontSize: 12
  }
});
