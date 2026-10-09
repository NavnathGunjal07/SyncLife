import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, Vibration, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '../constants/theme';
import { Exercise, WorkoutMode } from '../types';
import { AppButton } from './AppButton';
import { GradientCard } from './GradientCard';
import { MuscleThumb } from './MuscleMap';
import { ProgressRing } from './ProgressRing';
import { WorkoutAnimation } from './workoutAnim/WorkoutAnimation';

type Props = {
  visible: boolean;
  exercises: Exercise[];
  mode: WorkoutMode;
  tint: string;
  gradient: [string, string];
  /** Rest between sets / exercises, in seconds. */
  restSec: number;
  /** Names already ticked off — guided mode resumes at the first unticked one. */
  checked: string[];
  onExerciseDone: (name: string) => void;
  onFinish: () => void;
  onClose: () => void;
};

type Phase = 'work' | 'rest' | 'finished';

const fmt = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;

/**
 * Full-screen, one-exercise-at-a-time workout player: looping demo figure,
 * set counter, countdown for timed moves and an automatic rest timer.
 * Timers are driven by wall-clock deadlines so they stay correct if the JS
 * thread stalls or the app is briefly backgrounded.
 */
export function GuidedWorkout({ visible, exercises, mode, tint, gradient, restSec, checked, onExerciseDone, onFinish, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const [set, setSet] = useState(1);
  const [phase, setPhase] = useState<Phase>('work');
  const [paused, setPaused] = useState(true);
  const [deadline, setDeadline] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(0);
  // Seconds left when a timed exercise was paused.
  const pausedLeft = useRef<number | null>(null);

  const exercise = exercises[index];
  const timed = Boolean(exercise?.durationSec);
  const name = exercise ? (mode === 'Home' && exercise.homeAlt ? exercise.homeAlt : exercise.name) : '';
  const next = exercises[index + 1];

  // Reset to the first unticked exercise each time the player opens.
  useEffect(() => {
    if (!visible) return;
    const firstOpen = exercises.findIndex((ex) => !checked.includes(ex.name));
    setIndex(firstOpen === -1 ? 0 : firstOpen);
    setSet(1);
    setPhase(firstOpen === -1 ? 'finished' : 'work');
    setPaused(true);
    setDeadline(null);
    pausedLeft.current = null;
    // Only on open — not when `checked` changes mid-session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Tick the visible countdown.
  useEffect(() => {
    if (deadline === null) return;
    const tick = () => {
      const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) {
        setDeadline(null);
        Vibration.vibrate([0, 300, 150, 300]);
        if (phase === 'rest') {
          setPhase('work');
          setPaused(true);
        } else if (phase === 'work' && timed) {
          finishSet();
        }
      }
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deadline, phase]);

  if (!exercise && phase !== 'finished') return null;

  const totalSets = timed ? 1 : exercise?.sets ?? 1;

  const startRest = () => {
    setPhase('rest');
    setDeadline(Date.now() + restSec * 1000);
    setRemaining(restSec);
  };

  const advanceExercise = () => {
    if (index + 1 >= exercises.length) {
      setPhase('finished');
      setDeadline(null);
      return;
    }
    setIndex(index + 1);
    setSet(1);
    pausedLeft.current = null;
    startRest();
  };

  // Called when a set (or a timed exercise) is completed.
  function finishSet() {
    Vibration.vibrate(60);
    if (set < totalSets) {
      setSet(set + 1);
      startRest();
      return;
    }
    if (exercise && !checked.includes(exercise.name)) onExerciseDone(exercise.name);
    advanceExercise();
  }

  const toggleTimer = () => {
    if (!exercise?.durationSec) return;
    if (paused) {
      const left = pausedLeft.current ?? exercise.durationSec;
      setDeadline(Date.now() + left * 1000);
      setRemaining(left);
      setPaused(false);
    } else {
      pausedLeft.current = remaining;
      setDeadline(null);
      setPaused(true);
    }
  };

  const skipRest = () => {
    setDeadline(null);
    setPhase('work');
    setPaused(true);
  };

  const skipExercise = () => {
    setDeadline(null);
    pausedLeft.current = null;
    if (index + 1 >= exercises.length) {
      setPhase('finished');
      return;
    }
    setIndex(index + 1);
    setSet(1);
    setPhase('work');
    setPaused(true);
  };

  const doneCount = exercises.filter((ex) => checked.includes(ex.name)).length;
  const timedLeft = timed ? (deadline !== null && phase === 'work' ? remaining : pausedLeft.current ?? exercise?.durationSec ?? 0) : 0;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={[styles.root, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }]}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <Pressable onPress={onClose} hitSlop={12} style={styles.iconBtn} accessibilityLabel="Close workout">
            <Ionicons name="close" size={22} color={colors.text} />
          </Pressable>
          <Text style={styles.counter}>
            {phase === 'finished' ? 'Workout complete' : `Exercise ${index + 1} of ${exercises.length}`}
          </Text>
          <View style={styles.iconBtn} />
        </View>
        <View style={styles.segments}>
          {exercises.map((ex, i) => (
            <View
              key={ex.name}
              style={[
                styles.segment,
                checked.includes(ex.name) ? { backgroundColor: tint } : i === index && phase !== 'finished' ? { backgroundColor: `${tint}77` } : null
              ]}
            />
          ))}
        </View>

        {phase === 'finished' ? (
          <View style={styles.center}>
            <GradientCard gradient={gradient} style={styles.trophyCard}>
              <View style={styles.trophyInner}>
                <Ionicons name="trophy" size={64} color="#FFFFFF" />
                <Text style={styles.trophyTitle}>Great work!</Text>
                <Text style={styles.trophySub}>
                  {doneCount} of {exercises.length} exercises done
                </Text>
              </View>
            </GradientCard>
            <AppButton label="Save workout" icon="checkmark" onPress={onFinish} style={styles.fullBtn} />
            <AppButton label="Back to plan" variant="ghost" onPress={onClose} style={styles.fullBtn} />
          </View>
        ) : phase === 'rest' ? (
          <View style={styles.center}>
            <Text style={styles.phaseLabel}>REST</Text>
            <ProgressRing value={(remaining / restSec) * 100} size={220} stroke={14} color={tint} label={fmt(remaining)} sublabel="breathe" />
            <View style={styles.row}>
              <AppButton label="+15s" variant="outline" onPress={() => deadline && setDeadline(deadline + 15000)} />
              <AppButton label="Skip rest" icon="play-skip-forward" onPress={skipRest} />
            </View>
            <View style={styles.upNext}>
              <WorkoutAnimation name={name} size={120} fit />
              <Text style={styles.upNextLabel}>UP NEXT</Text>
              <Text style={styles.upNextName}>
                {name}
                {!timed && totalSets > 1 ? ` · set ${set} of ${totalSets}` : ''}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.center}>
            <View style={[styles.figureWrap, { backgroundColor: `${tint}1A`, borderColor: `${tint}44` }]}>
              <WorkoutAnimation name={name} size={250} paused={timed && paused && Boolean(pausedLeft.current)} />
              <View style={styles.muscleBadge}>
                <MuscleThumb name={name} height={76} />
              </View>
            </View>
            <Text style={styles.name}>{name}</Text>
            {timed ? (
              <>
                <Text style={[styles.bigNumber, { color: tint }]}>{fmt(timedLeft)}</Text>
                <View style={styles.row}>
                  <AppButton label={paused ? (pausedLeft.current ? 'Resume' : 'Start') : 'Pause'} icon={paused ? 'play' : 'pause'} onPress={toggleTimer} />
                  <AppButton label="Done" icon="checkmark" variant="outline" onPress={() => { setDeadline(null); finishSet(); }} />
                </View>
              </>
            ) : (
              <>
                <View style={styles.setRow}>
                  <View style={styles.setBox}>
                    <Text style={[styles.bigNumber, { color: tint }]}>{exercise?.reps}</Text>
                    <Text style={styles.setLabel}>reps</Text>
                  </View>
                  <View style={styles.setBox}>
                    <Text style={styles.bigNumber}>
                      {set}<Text style={styles.ofTotal}>/{totalSets}</Text>
                    </Text>
                    <Text style={styles.setLabel}>set</Text>
                  </View>
                </View>
                <AppButton label={set < totalSets ? 'Set done — rest' : 'Exercise done'} icon="checkmark" onPress={finishSet} style={styles.fullBtn} />
              </>
            )}
            <Pressable onPress={skipExercise} hitSlop={8}>
              <Text style={styles.skip}>Skip exercise</Text>
            </Pressable>
            {next ? (
              <Text style={styles.nextHint}>Next: {mode === 'Home' && next.homeAlt ? next.homeAlt : next.name}</Text>
            ) : null}
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: colors.background, flex: 1, paddingHorizontal: 20 },
  topBar: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  iconBtn: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: 999, height: 38, justifyContent: 'center', width: 38 },
  counter: { color: colors.textMuted, fontSize: 14, fontWeight: '800' },
  segments: { flexDirection: 'row', gap: 4, marginTop: 14 },
  segment: { backgroundColor: colors.surfaceAlt, borderRadius: 999, flex: 1, height: 5 },
  center: { alignItems: 'center', flex: 1, gap: 18, justifyContent: 'center' },
  figureWrap: { alignItems: 'center', borderRadius: 28, borderWidth: 1, height: 256, justifyContent: 'center', overflow: 'hidden', width: 290 },
  muscleBadge: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    padding: 6,
    position: 'absolute',
    right: 8,
    top: 8
  },
  name: { color: colors.text, fontSize: 26, fontWeight: '900', textAlign: 'center' },
  setRow: { flexDirection: 'row', gap: 14 },
  setBox: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, minWidth: 110, paddingVertical: 12 },
  bigNumber: { color: colors.text, fontSize: 44, fontWeight: '900' },
  ofTotal: { color: colors.textMuted, fontSize: 22 },
  setLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  row: { flexDirection: 'row', gap: 12 },
  fullBtn: { alignSelf: 'stretch' },
  skip: { color: colors.textMuted, fontSize: 14, fontWeight: '700', textDecorationLine: 'underline' },
  nextHint: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  phaseLabel: { color: colors.textMuted, fontSize: 14, fontWeight: '900', letterSpacing: 4 },
  upNext: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: 16, gap: 4, padding: 14, alignSelf: 'stretch' },
  upNextLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  upNextName: { color: colors.text, fontSize: 17, fontWeight: '800', textAlign: 'center' },
  trophyCard: { alignSelf: 'stretch' },
  trophyInner: { alignItems: 'center', gap: 8, padding: 32 },
  trophyTitle: { color: '#FFFFFF', fontSize: 28, fontWeight: '900' },
  trophySub: { color: 'rgba(255,255,255,0.85)', fontSize: 15, fontWeight: '700' }
});
