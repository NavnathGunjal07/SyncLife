import { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { musclesFor } from '../../constants/muscles';
import { Highlight, drawFrame } from './draw';
import { animFor } from './library';
import { Skeleton, sample } from './rig';

type Props = {
  /** Exercise name — picks the animation, equipment and highlighted muscles. */
  name: string;
  size?: number;
  /** false renders a single still frame at `phase` (list thumbnails). */
  animated?: boolean;
  /** Loop position for still frames, 0..1 (0.5 = the "worked" end of the rep). */
  phase?: number;
  /** Pause an animated figure (e.g. while a timer is paused). */
  paused?: boolean;
  /** Crop tightly around the body instead of the full 200x200 stage. */
  fit?: boolean;
  highlight?: Highlight;
};

const FPS = 30;

// Square viewBox around the body over the whole loop (stable while animating).
function fitBox(frames: Skeleton[]): string {
  const pts = frames.flatMap((s) => [s.head, s.handA, s.handB, s.toeA, s.toeB, s.kneeA, s.kneeB, s.elbowA, s.elbowB, s.hip]);
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const pad = 14;
  const minX = Math.min(...xs) - pad;
  const maxX = Math.max(...xs) + pad;
  const minY = Math.min(...ys) - pad;
  const maxY = Math.max(...ys) + pad;
  const side = Math.max(maxX - minX, maxY - minY);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  return `${cx - side / 2} ${cy - side / 2} ${side} ${side}`;
}

/**
 * Original anatomical exercise animation: a shaded figure performing the move,
 * with targeted muscles in red and synergists in pink, plus the equipment.
 */
export function WorkoutAnimation({ name, size = 200, animated = true, phase = 0.5, paused, fit, highlight }: Props) {
  const anim = useMemo(() => animFor(name), [name]);
  const hl = useMemo(() => highlight ?? musclesFor(name), [highlight, name]);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [t, setT] = useState(phase);
  const elapsed = useRef(0);

  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => alive && setReduceMotion(v)).catch(() => undefined);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);

  const playing = animated && !paused && !reduceMotion;

  useEffect(() => {
    if (!playing) return;
    let raf: number | null = null;
    let last = Date.now();
    let lastPaint = 0;
    const tick = () => {
      const now = Date.now();
      elapsed.current += now - last;
      last = now;
      if (now - lastPaint >= 1000 / FPS) {
        lastPaint = now;
        setT((elapsed.current / anim.period) % 1);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      if (raf != null) cancelAnimationFrame(raf);
    };
  }, [playing, anim]);

  const current = playing || (animated && paused) ? t : phase;
  const skeleton = sample(anim, current);
  const shapes = drawFrame(anim, skeleton, current, hl);
  const viewBox = useMemo(
    () => (fit ? fitBox(Array.from({ length: 8 }, (_, i) => sample(anim, i / 8))) : '0 0 200 200'),
    [fit, anim]
  );

  return (
    <Svg width={size} height={size} viewBox={viewBox} accessibilityLabel={`${name} demonstration`}>
      {shapes.map((s, i) => (
        <Path
          key={i}
          d={s.d}
          fill={s.fill ?? 'none'}
          stroke={s.stroke ?? 'none'}
          strokeWidth={s.sw ?? 0}
          opacity={s.op ?? 1}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      ))}
    </Svg>
  );
}
