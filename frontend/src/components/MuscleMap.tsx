import { StyleSheet, Text, View } from 'react-native';
import Body, { ExtendedBodyPart } from 'react-native-body-highlighter';

import { MUSCLE_LABEL, MuscleTargets, bestSide, musclesFor } from '../constants/muscles';
import { colors } from '../constants/theme';

// Anatomy-chart convention: strong red = targeted, light red = synergists.
export const MUSCLE_COLORS = { primary: '#EF4444', secondary: '#FCA5A5', base: '#3A3A3A' } as const;

function bodyData(targets: MuscleTargets): ExtendedBodyPart[] {
  return [
    ...targets.secondary.map((slug) => ({ slug, color: MUSCLE_COLORS.secondary })),
    ...targets.primary.map((slug) => ({ slug, color: MUSCLE_COLORS.primary }))
  ];
}

/** Small single-side body for list thumbnails — shows the side that matters. */
export function MuscleThumb({ name, height = 56 }: { name: string; height?: number }) {
  const targets = musclesFor(name);
  return (
    <Body
      data={bodyData(targets)}
      side={bestSide(targets)}
      scale={height / 400}
      border="none"
      defaultFill={MUSCLE_COLORS.base}
    />
  );
}

/** Front + back anatomy with targeted / synergist muscles and a legend. */
export function MuscleMap({ name, height = 230 }: { name: string; height?: number }) {
  const targets = musclesFor(name);
  if (!targets.primary.length) return null;
  const data = bodyData(targets);
  const label = (list: MuscleTargets['primary']) => list.map((m) => MUSCLE_LABEL[m] ?? m).join(', ');

  return (
    <View style={styles.wrap}>
      <View style={styles.bodies}>
        <View style={styles.side}>
          <Body data={data} side="front" scale={height / 400} border="none" defaultFill={MUSCLE_COLORS.base} />
          <Text style={styles.sideLabel}>FRONT</Text>
        </View>
        <View style={styles.side}>
          <Body data={data} side="back" scale={height / 400} border="none" defaultFill={MUSCLE_COLORS.base} />
          <Text style={styles.sideLabel}>BACK</Text>
        </View>
      </View>
      <View style={styles.legend}>
        <LegendRow color={MUSCLE_COLORS.primary} title="Targeted" muscles={label(targets.primary)} />
        {targets.secondary.length ? (
          <LegendRow color={MUSCLE_COLORS.secondary} title="Synergist" muscles={label(targets.secondary)} />
        ) : null}
      </View>
    </View>
  );
}

function LegendRow({ color, title, muscles }: { color: string; title: string; muscles: string }) {
  return (
    <View style={styles.legendRow}>
      <View style={[styles.swatch, { backgroundColor: color }]} />
      <Text style={styles.legendText}>
        <Text style={styles.legendTitle}>{title}: </Text>
        {muscles}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 16,
    gap: 12,
    padding: 14
  },
  bodies: { flexDirection: 'row', justifyContent: 'space-around' },
  side: { alignItems: 'center', gap: 6 },
  sideLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  legend: { gap: 6 },
  legendRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 8 },
  swatch: { borderRadius: 3, height: 12, marginTop: 3, width: 12 },
  legendText: { color: colors.textMuted, flex: 1, fontSize: 13, lineHeight: 18 },
  legendTitle: { color: colors.text, fontWeight: '800' }
});
