import { useEffect, useRef, useState } from 'react';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { colors } from '../constants/theme';

/**
 * Original, self-owned schematic exercise animations — a parametric stick figure
 * interpolated between two key poses. No external media, no licensing concerns.
 *
 * Each pose is 11 joints flattened to 22 numbers in a 100x120 viewBox:
 * head, shoulder, hip, elbowL, handL, elbowR, handR, kneeL, footL, kneeR, footR.
 */
export type Archetype =
  | 'squat' | 'press' | 'raise' | 'curl' | 'row' | 'pushup'
  | 'plank' | 'crunch' | 'jump' | 'run' | 'cycle' | 'stretch';

const POSES: Record<Archetype, [number[], number[]]> = {
  squat: [
    [50, 16, 50, 34, 50, 62, 42, 46, 40, 40, 58, 46, 60, 40, 45, 86, 44, 110, 55, 86, 56, 110],
    [50, 30, 50, 48, 50, 76, 42, 60, 38, 52, 58, 60, 62, 52, 38, 92, 44, 110, 62, 92, 56, 110]
  ],
  press: [
    [50, 16, 50, 34, 50, 66, 40, 40, 44, 26, 60, 40, 56, 26, 45, 88, 44, 110, 55, 88, 56, 110],
    [50, 16, 50, 34, 50, 66, 46, 22, 48, 8, 54, 22, 52, 8, 45, 88, 44, 110, 55, 88, 56, 110]
  ],
  raise: [
    [50, 16, 50, 34, 50, 66, 43, 48, 42, 60, 57, 48, 58, 60, 45, 88, 44, 110, 55, 88, 56, 110],
    [50, 16, 50, 34, 50, 66, 38, 38, 26, 36, 62, 38, 74, 36, 45, 88, 44, 110, 55, 88, 56, 110]
  ],
  curl: [
    [50, 16, 50, 34, 50, 66, 42, 50, 41, 64, 58, 50, 59, 64, 45, 88, 44, 110, 55, 88, 56, 110],
    [50, 16, 50, 34, 50, 66, 42, 50, 46, 34, 58, 50, 54, 34, 45, 88, 44, 110, 55, 88, 56, 110]
  ],
  row: [
    [50, 16, 50, 34, 50, 66, 44, 44, 46, 30, 56, 44, 54, 30, 45, 88, 44, 110, 55, 88, 56, 110],
    [50, 16, 50, 34, 50, 66, 38, 46, 44, 48, 62, 46, 56, 48, 45, 88, 44, 110, 55, 88, 56, 110]
  ],
  pushup: [
    [80, 60, 68, 64, 44, 74, 68, 84, 68, 104, 64, 84, 64, 104, 28, 80, 14, 86, 30, 83, 16, 89],
    [80, 72, 68, 76, 44, 84, 74, 90, 68, 104, 70, 90, 64, 104, 28, 88, 14, 92, 30, 91, 16, 95]
  ],
  plank: [
    [80, 70, 68, 74, 44, 82, 68, 90, 68, 104, 64, 90, 64, 104, 28, 86, 14, 90, 30, 89, 16, 93],
    [80, 71, 68, 75, 44, 85, 68, 90, 68, 104, 64, 90, 64, 104, 28, 87, 14, 90, 30, 90, 16, 93]
  ],
  crunch: [
    [30, 90, 38, 94, 52, 96, 36, 88, 32, 84, 40, 88, 36, 84, 42, 82, 44, 100, 60, 82, 58, 100],
    [42, 74, 46, 84, 52, 96, 46, 80, 44, 72, 50, 80, 48, 72, 42, 82, 44, 100, 60, 82, 58, 100]
  ],
  jump: [
    [50, 16, 50, 34, 50, 64, 46, 46, 47, 58, 54, 46, 53, 58, 48, 86, 48, 108, 52, 86, 52, 108],
    [50, 16, 50, 34, 50, 64, 42, 26, 38, 14, 58, 26, 62, 14, 40, 88, 34, 108, 60, 88, 66, 108]
  ],
  run: [
    [50, 16, 50, 34, 50, 64, 44, 46, 42, 56, 56, 44, 58, 34, 46, 80, 44, 94, 56, 90, 60, 108],
    [50, 16, 50, 34, 50, 64, 44, 44, 42, 34, 56, 46, 58, 56, 44, 90, 40, 108, 54, 80, 56, 94]
  ],
  cycle: [
    [44, 20, 46, 36, 52, 64, 54, 54, 64, 54, 56, 52, 66, 52, 46, 78, 44, 90, 58, 86, 62, 102],
    [44, 20, 46, 36, 52, 64, 54, 54, 64, 54, 56, 52, 66, 52, 46, 86, 44, 102, 58, 78, 62, 90]
  ],
  stretch: [
    [50, 16, 50, 34, 50, 66, 46, 24, 48, 12, 54, 24, 52, 12, 46, 88, 45, 110, 54, 88, 55, 110],
    [54, 58, 52, 56, 50, 68, 50, 74, 50, 92, 52, 74, 52, 92, 46, 88, 45, 110, 54, 88, 55, 110]
  ]
};

// Resolve an exercise name to the closest movement archetype. Order matters —
// more specific patterns are checked before generic ones (e.g. "leg press").
export function archetypeFor(name?: string): Archetype {
  const n = (name ?? '').toLowerCase();
  const has = (...k: string[]) => k.some((s) => n.includes(s));
  if (has('plank')) return 'plank';
  if (has('crunch', 'sit-up', 'sit up', 'situp')) return 'crunch';
  if (has('push', 'bench', 'fly', 'dip', 'decline', 'pike')) return 'pushup';
  if (has('curl')) return 'curl';
  if (has('row', 'pulldown', 'pull-up', 'pullup', 'pull up', 'lat ')) return 'row';
  if (has('squat', 'lunge', 'leg press', 'wall sit', 'calf')) return 'squat';
  if (has('lateral', 'raise')) return 'raise';
  if (has('shoulder', 'press', 'overhead')) return 'press';
  if (has('burpee', 'hiit', 'jump')) return 'jump';
  if (has('run', 'tread', 'walk', 'sprint')) return 'run';
  if (has('cycl', 'bike')) return 'cycle';
  if (has('stretch', 'hamstring', 'mobility')) return 'stretch';
  return 'squat';
}

const lerp = (a: number[], b: number[], t: number) => a.map((v, i) => v + ((b[i] ?? v) - v) * t);

function skeleton(p: number[]): string {
  const [hx, hy, sx, sy, px, py, elx, ely, hlx, hly, erx, ery, hrx, hry, klx, kly, flx, fly, krx, kry, frx, fry] = p;
  return (
    `M ${sx} ${sy} L ${px} ${py}` + // spine
    ` M ${hx} ${(hy ?? 0) + 6.5} L ${sx} ${sy}` + // neck
    ` M ${sx} ${sy} L ${elx} ${ely} L ${hlx} ${hly}` + // left arm
    ` M ${sx} ${sy} L ${erx} ${ery} L ${hrx} ${hry}` + // right arm
    ` M ${px} ${py} L ${klx} ${kly} L ${flx} ${fly}` + // left leg
    ` M ${px} ${py} L ${krx} ${kry} L ${frx} ${fry}` // right leg
  );
}

type FigureProps = { kind: Archetype; t?: number; color?: string; size?: number };

/** A single frame of the figure at phase `t` (0..1). Pure — no animation. */
export function ExerciseFigure({ kind, t = 0.5, color = colors.accent, size = 120 }: FigureProps) {
  const [a, b] = POSES[kind];
  const p = lerp(a, b, t);
  return (
    <Svg width={size} height={size} viewBox="0 0 100 120">
      <Line x1={10} y1={114} x2={90} y2={114} stroke={colors.border} strokeWidth={2} strokeLinecap="round" />
      <Path d={skeleton(p)} stroke={color} strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={p[0]} cy={p[1]} r={6.5} fill={color} />
    </Svg>
  );
}

// Smooth ping-pong phase in [0,1] via a sine wave (natural ease in/out).
function useOscillator(periodMs = 1300): number {
  const [t, setT] = useState(0.5);
  const raf = useRef<number | null>(null);
  useEffect(() => {
    const start = Date.now();
    const tick = () => {
      const e = Date.now() - start;
      setT((Math.sin((e / periodMs) * Math.PI * 2 - Math.PI / 2) + 1) / 2);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current != null) cancelAnimationFrame(raf.current);
    };
  }, [periodMs]);
  return t;
}

/** The figure, animated on a loop. Use for the one-at-a-time detail view. */
export function ExerciseAnimation({ kind, color, size }: Omit<FigureProps, 't'>) {
  const t = useOscillator();
  return <ExerciseFigure kind={kind} t={t} color={color} size={size} />;
}
