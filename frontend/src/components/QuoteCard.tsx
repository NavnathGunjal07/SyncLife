import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { Quote } from '../constants/quotes';

type Props = {
  quote: Quote;
  gradient: [string, string];
  variant?: 'big' | 'compact';
  /** Optional eyebrow label, e.g. "Daily motivation" or "Money wisdom". */
  label?: string;
};

let gradientCounter = 0;

export function QuoteCard({ quote, gradient, variant = 'big', label }: Props) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const idRef = useRef(`quoteGrad${gradientCounter++}`);
  const big = variant === 'big';

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ w: width, h: height });
  };

  return (
    <View
      onLayout={onLayout}
      style={[styles.card, big ? styles.big : styles.compact, { backgroundColor: gradient[0] }]}
    >
      {size.w > 0 ? (
        <Svg width={size.w} height={size.h} style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id={idRef.current} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={gradient[0]} />
              <Stop offset="1" stopColor={gradient[1]} />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width={size.w} height={size.h} fill={`url(#${idRef.current})`} />
        </Svg>
      ) : null}

      <View style={styles.inner}>
        {label ? (
          <View style={styles.labelRow}>
            <Ionicons name="sparkles" size={13} color="rgba(255,255,255,0.9)" />
            <Text style={styles.label}>{label}</Text>
          </View>
        ) : null}
        <Text style={[styles.quote, big ? styles.quoteBig : styles.quoteSmall]}>“{quote.text}”</Text>
        <Text style={styles.author}>— {quote.author}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 18, overflow: 'hidden' },
  big: { minHeight: 150 },
  compact: { minHeight: 84 },
  inner: { gap: 8, padding: 18 },
  labelRow: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  label: { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase' },
  quote: { color: '#FFFFFF', fontWeight: '800' },
  quoteBig: { fontSize: 19, lineHeight: 27 },
  quoteSmall: { fontSize: 15, lineHeight: 22 },
  author: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '700' }
});
