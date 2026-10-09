/**
 * Tiny 2D character rig for SyncLife's original exercise animations.
 *
 * Angles are absolute, in degrees: 0 = segment points straight down,
 * 90 = toward the figure's front (side view) / outward (front & back views),
 * 180 = straight up. Key poses are authored with angles and/or IK targets for
 * hands and feet; between key poses we interpolate angles (so limbs never
 * shrink) and re-solve IK so planted hands/feet stay planted.
 */

export type Vec = [number, number];
export type View = 'side' | 'front' | 'back';
export type Anchor = 'hip' | 'ankleA' | 'toeA' | 'handA';
export type SegKey = 'uaA' | 'faA' | 'uaB' | 'faB' | 'thA' | 'shA' | 'thB' | 'shB';

export const L = {
  torso: 40,
  neck: 4,
  headR: 8.5,
  ua: 26,
  fa: 23,
  th: 36,
  sh: 34,
  foot: 11,
  shoulderW: 16, // half shoulder width (front/back views)
  hipW: 8 // half hip width (front/back views)
} as const;

const SEG_LEN: Record<SegKey, number> = {
  uaA: L.ua, faA: L.fa, uaB: L.ua, faB: L.fa, thA: L.th, shA: L.sh, thB: L.th, shB: L.sh
};

/** A key pose as authored in the animation library. */
export type Pose = {
  hip?: Vec;
  /** Anchor target for anims whose anchor isn't the hip. */
  at?: Vec;
  torso?: number;
  head?: number;
  armA?: [number, number];
  armB?: [number, number];
  legA?: [number, number];
  legB?: [number, number];
  /** IK targets (world). B defaults to A in side view. */
  hands?: [Vec, Vec?];
  feet?: [Vec, Vec?];
  handsTo?: 'head' | 'chest';
  elbowBend?: Vec;
  kneeBend?: Vec;
  /** Bend directions for the B limbs (default: same as A, mirrored in front/back views). */
  elbowBendB?: Vec;
  kneeBendB?: Vec;
  /** 0..1 heel lift (calf raise / tiptoe). */
  toe?: number;
  /** Visual length multipliers for foreshortened segments. */
  scale?: Partial<Record<SegKey, number>>;
};

/** Fully resolved pose: hip position + every segment angle. */
type Canon = {
  hip: Vec;
  at: Vec;
  torso: number;
  head: number;
  a: Record<SegKey, number>;
  toe: number;
  scale: Record<SegKey, number>;
};

export type Skeleton = {
  view: View;
  hip: Vec;
  hipA: Vec;
  hipB: Vec;
  neck: Vec;
  shoulderA: Vec;
  shoulderB: Vec;
  head: Vec;
  elbowA: Vec;
  handA: Vec;
  elbowB: Vec;
  handB: Vec;
  kneeA: Vec;
  ankleA: Vec;
  toeA: Vec;
  kneeB: Vec;
  ankleB: Vec;
  toeB: Vec;
};

export type Anim = {
  view: View;
  anchor: Anchor;
  /** Default anchor target (world) when anchor isn't the hip. */
  at?: Vec;
  base?: Pose;
  frames: Pose[];
  /** true: f0→f1→…→fn→f0. false (default): ping-pong f0→…→fn→…→f0. */
  cycle?: boolean;
  /** Milliseconds for one full loop. */
  period: number;
  props?: Prop[];
};

export type HandItem = 'barbell' | 'dumbbell' | 'backpack' | 'bottle';
export type Prop =
  | { kind: 'rect'; x: number; y: number; w: number; h: number; r?: number; rot?: number }
  | { kind: 'line'; a: Vec; b: Vec; w?: number }
  | { kind: 'circle'; c: Vec; r: number }
  | { kind: 'hand'; item: HandItem }
  | { kind: 'cable'; from: Vec; band?: boolean }
  | { kind: 'rope' }
  | { kind: 'platform' }
  | { kind: 'crank'; c: Vec; r: number };

// ── math ──────────────────────────────────────────────────────────────
const RAD = Math.PI / 180;
export const dir = (deg: number, mirror = false): Vec => [(mirror ? -1 : 1) * Math.sin(deg * RAD), Math.cos(deg * RAD)];
export const add = (a: Vec, b: Vec): Vec => [a[0] + b[0], a[1] + b[1]];
export const sub = (a: Vec, b: Vec): Vec => [a[0] - b[0], a[1] - b[1]];
export const mul = (a: Vec, k: number): Vec => [a[0] * k, a[1] * k];
export const lerpV = (a: Vec, b: Vec, t: number): Vec => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const len = (a: Vec) => Math.hypot(a[0], a[1]);
const angleOf = (v: Vec, mirror = false) => Math.atan2((mirror ? -1 : 1) * v[0], v[1]) / RAD;
const lerpAngle = (a: number, b: number, t: number) => {
  let d = ((b - a + 540) % 360) - 180;
  if (d === -180 && b > a) d = 180;
  return a + d * t;
};

/** Two-bone IK: returns the middle joint and the (reach-clamped) end point. */
function solveIK(p: Vec, target: Vec, l1: number, l2: number, bend: Vec): [Vec, Vec] {
  const v = sub(target, p);
  const d = Math.min(Math.max(len(v), Math.abs(l1 - l2) + 0.01), l1 + l2 - 0.01);
  const u = mul(v, 1 / (len(v) || 1));
  const a = (l1 * l1 + d * d - l2 * l2) / (2 * d);
  const h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  const base = add(p, mul(u, a));
  const perp: Vec = [-u[1], u[0]];
  const j1 = add(base, mul(perp, h));
  const j2 = sub(base, mul(perp, h));
  const dot = (j: Vec) => (j[0] - base[0]) * bend[0] + (j[1] - base[1]) * bend[1];
  return [dot(j1) >= dot(j2) ? j1 : j2, add(p, mul(u, d))];
}

// ── forward kinematics ────────────────────────────────────────────────
function fk(c: Canon, view: View): Skeleton {
  const side = view === 'side';
  const hip = c.hip;
  const up = dir(c.torso);
  const neck = add(hip, mul(up, L.torso));
  const shoulderC = add(hip, mul(up, L.torso - 4));
  const perp: Vec = [-up[1], up[0]]; // screen-right when upright
  // In side view the far limbs sit slightly up/back for depth.
  const farOff: Vec = side ? [-1.5, -1] : [0, 0];
  const shoulderA = side ? shoulderC : add(shoulderC, mul(perp, L.shoulderW));
  const shoulderB = side ? add(shoulderC, farOff) : sub(shoulderC, mul(perp, L.shoulderW));
  const hipA = side ? hip : add(hip, mul(perp, L.hipW));
  const hipB = side ? add(hip, farOff) : sub(hip, mul(perp, L.hipW));
  const mB = !side; // B limbs are mirrored in front/back views
  const seg = (from: Vec, k: SegKey, mirror: boolean) => add(from, mul(dir(c.a[k], mirror), SEG_LEN[k] * c.scale[k]));
  const elbowA = seg(shoulderA, 'uaA', false);
  const handA = seg(elbowA, 'faA', false);
  const elbowB = seg(shoulderB, 'uaB', mB);
  const handB = seg(elbowB, 'faB', mB);
  const kneeA = seg(hipA, 'thA', false);
  const ankleA = seg(kneeA, 'shA', false);
  const kneeB = seg(hipB, 'thB', mB);
  const ankleB = seg(kneeB, 'shB', mB);
  const head = add(neck, mul(dir(c.head), L.neck + L.headR));
  return {
    view, hip, hipA, hipB, neck, shoulderA, shoulderB, head, elbowA, handA, elbowB, handB,
    kneeA, ankleA, toeA: footTip(ankleA, c.a.shA, c.toe, view), kneeB, ankleB, toeB: footTip(ankleB, c.a.shB, c.toe, view, mB)
  };
}

function footTip(ankle: Vec, shin: number, toe: number, view: View, mirror = false): Vec {
  if (view !== 'side') return add(ankle, [mirror ? -3 : 3, 4]);
  return add(ankle, mul(dir(shin + 90 - 55 * toe), L.foot));
}

function anchorPoint(s: Skeleton, anchor: Anchor): Vec {
  return anchor === 'hip' ? s.hip : anchor === 'ankleA' ? s.ankleA : anchor === 'toeA' ? s.toeA : s.handA;
}

function translate(s: Skeleton, d: Vec): Skeleton {
  const out = { ...s } as Skeleton;
  (Object.keys(s) as (keyof Skeleton)[]).forEach((k) => {
    if (k !== 'view') (out as Record<string, unknown>)[k] = add(s[k] as Vec, d);
  });
  return out;
}

type IKSpec = { hands?: [Vec, Vec]; feet?: [Vec, Vec]; handsTo?: 'head' | 'chest'; elbowBend: Vec; kneeBend: Vec; elbowBendB: Vec; kneeBendB: Vec };

function applyIK(s: Skeleton, ik: IKSpec, c: Canon): Skeleton {
  const side = s.view === 'side';
  const out = { ...s };
  let hands = ik.hands;
  if (ik.handsTo) {
    const up = sub(s.neck, s.hip);
    const n: Vec = mul([-up[1], up[0]], 1 / (len(up) || 1)); // side view: front of torso
    if (ik.handsTo === 'head') {
      const t = side ? add(s.head, mul(n, -7)) : add(s.head, [0, 2]);
      hands = side ? [t, add(t, [-1, -1])] : [add(t, [9, 0]), add(t, [-9, 0])];
    } else {
      const chest = lerpV(s.neck, s.hip, 0.28);
      hands = side ? [add(chest, mul(n, 12)), add(chest, mul(n, 11))] : [add(chest, [4, 0]), add(chest, [-4, 0])];
    }
  }
  if (hands) {
    const [eA, hA] = solveIK(s.shoulderA, hands[0], L.ua * c.scale.uaA, L.fa * c.scale.faA, ik.elbowBend);
    const [eB, hB] = solveIK(s.shoulderB, hands[1], L.ua * c.scale.uaB, L.fa * c.scale.faB, ik.elbowBendB);
    Object.assign(out, { elbowA: eA, handA: hA, elbowB: eB, handB: hB });
  }
  if (ik.feet) {
    const [kA, aA] = solveIK(s.hipA, ik.feet[0], L.th * c.scale.thA, L.sh * c.scale.shA, ik.kneeBend);
    const [kB, aB] = solveIK(s.hipB, ik.feet[1], L.th * c.scale.thB, L.sh * c.scale.shB, ik.kneeBendB);
    const shA = angleOf(sub(aA, kA));
    const shB = angleOf(sub(aB, kB), !side);
    Object.assign(out, {
      kneeA: kA, ankleA: aA, kneeB: kB, ankleB: aB,
      toeA: footTip(aA, shA, c.toe, s.view), toeB: footTip(aB, shB, c.toe, s.view, !side)
    });
  }
  return out;
}

// ── resolving key poses ───────────────────────────────────────────────
type Resolved = { canon: Canon; ik: IKSpec; at: Vec };

const DEFAULT_ANGLES: Record<SegKey, number> = { uaA: 4, faA: 8, uaB: -4, faB: 2, thA: 0, shA: 0, thB: 0, shB: 0 };

function resolve(anim: Anim, pose: Pose): Resolved {
  const p = { ...anim.base, ...pose };
  const side = anim.view === 'side';
  const a: Record<SegKey, number> = { ...DEFAULT_ANGLES };
  if (!side) Object.assign(a, { uaA: 6, faA: 6, uaB: 6, faB: 6, thA: 3, thB: 3 });
  if (p.armA) [a.uaA, a.faA] = p.armA;
  if (p.armB) [a.uaB, a.faB] = p.armB;
  else if (p.armA) [a.uaB, a.faB] = p.armA;
  if (p.legA) [a.thA, a.shA] = p.legA;
  if (p.legB) [a.thB, a.shB] = p.legB;
  else if (p.legA) [a.thB, a.shB] = p.legA;
  const scale = { uaA: 1, faA: 1, uaB: 1, faB: 1, thA: 1, shA: 1, thB: 1, shB: 1, ...p.scale };
  const canon: Canon = { hip: p.hip ?? [100, 112], at: p.at ?? anim.at ?? [100, 182], torso: p.torso ?? 180, head: p.head ?? p.torso ?? 180, a, toe: p.toe ?? 0, scale };
  const mirrorTarget = (v: Vec): Vec => (side ? v : [200 - v[0], v[1]]);
  const flip = (b: Vec): Vec => (side ? b : [-b[0], b[1]]);
  const elbowBend: Vec = p.elbowBend ?? (side ? [-0.4, 1] : [1, 0.3]);
  const kneeBend: Vec = p.kneeBend ?? (side ? [1, -0.1] : [1, 0]);
  const ik: IKSpec = {
    hands: p.hands ? [p.hands[0], p.hands[1] ?? mirrorTarget(p.hands[0])] : undefined,
    feet: p.feet ? [p.feet[0], p.feet[1] ?? mirrorTarget(p.feet[0])] : undefined,
    handsTo: p.handsTo,
    elbowBend,
    kneeBend,
    elbowBendB: p.elbowBendB ?? flip(elbowBend),
    kneeBendB: p.kneeBendB ?? flip(kneeBend)
  };
  // Bake anchor + IK into the canonical angles so interpolation is smooth.
  let s = fk(canon, anim.view);
  if (anim.anchor !== 'hip') s = translate(s, sub(canon.at, anchorPoint(s, anim.anchor)));
  s = applyIK(s, ik, canon);
  const m = !side;
  const ang = (from: Vec, to: Vec, mirror: boolean) => angleOf(sub(to, from), mirror);
  canon.hip = s.hip;
  canon.a = {
    uaA: ang(s.shoulderA, s.elbowA, false), faA: ang(s.elbowA, s.handA, false),
    uaB: ang(s.shoulderB, s.elbowB, m), faB: ang(s.elbowB, s.handB, m),
    thA: ang(s.hipA, s.kneeA, false), shA: ang(s.kneeA, s.ankleA, false),
    thB: ang(s.hipB, s.kneeB, m), shB: ang(s.kneeB, s.ankleB, m)
  };
  return { canon, ik, at: anchorPoint(s, anim.anchor) };
}

const cache = new WeakMap<Anim, Resolved[]>();
const resolvedFrames = (anim: Anim) => {
  let r = cache.get(anim);
  if (!r) {
    r = anim.frames.map((f) => resolve(anim, f));
    cache.set(anim, r);
  }
  return r;
};

const ease = (t: number) => (1 - Math.cos(Math.PI * t)) / 2;

/** Skeleton for `anim` at loop phase `phase` in [0, 1). */
export function sample(anim: Anim, phase: number): Skeleton {
  const frames = resolvedFrames(anim);
  const n = frames.length;
  let i: number;
  let j: number;
  let u: number;
  const p = ((phase % 1) + 1) % 1;
  if (n === 1) {
    i = j = 0;
    u = 0;
  } else if (anim.cycle) {
    const x = p * n;
    i = Math.floor(x) % n;
    j = (i + 1) % n;
    u = ease(x - Math.floor(x));
  } else {
    const order = [...Array(n).keys(), ...Array.from({ length: n - 2 }, (_, k) => n - 2 - k)];
    const m = order.length;
    const x = p * m;
    const k = Math.floor(x) % m;
    i = order[k] ?? 0;
    j = order[(k + 1) % m] ?? 0;
    u = ease(x - Math.floor(x));
  }
  const A = frames[i]!;
  const B = frames[j]!;
  const keys = Object.keys(A.canon.a) as SegKey[];
  const canon: Canon = {
    hip: lerpV(A.canon.hip, B.canon.hip, u),
    at: lerpV(A.at, B.at, u),
    torso: lerpAngle(A.canon.torso, B.canon.torso, u),
    head: lerpAngle(A.canon.head, B.canon.head, u),
    toe: A.canon.toe + (B.canon.toe - A.canon.toe) * u,
    a: Object.fromEntries(keys.map((k) => [k, lerpAngle(A.canon.a[k], B.canon.a[k], u)])) as Record<SegKey, number>,
    scale: Object.fromEntries(keys.map((k) => [k, A.canon.scale[k] + (B.canon.scale[k] - A.canon.scale[k]) * u])) as Record<SegKey, number>
  };
  let s = fk(canon, anim.view);
  if (anim.anchor !== 'hip') s = translate(s, sub(canon.at, anchorPoint(s, anim.anchor)));
  // Keep contacts planted: re-solve IK where both key poses used it.
  const lerpPair = (x?: [Vec, Vec], y?: [Vec, Vec]): [Vec, Vec] | undefined =>
    x && y ? [lerpV(x[0], y[0], u), lerpV(x[1], y[1], u)] : undefined;
  const ik: IKSpec = {
    hands: lerpPair(A.ik.hands, B.ik.hands),
    feet: lerpPair(A.ik.feet, B.ik.feet),
    handsTo: A.ik.handsTo && A.ik.handsTo === B.ik.handsTo ? A.ik.handsTo : undefined,
    elbowBend: lerpV(A.ik.elbowBend, B.ik.elbowBend, u),
    kneeBend: lerpV(A.ik.kneeBend, B.ik.kneeBend, u),
    elbowBendB: lerpV(A.ik.elbowBendB, B.ik.elbowBendB, u),
    kneeBendB: lerpV(A.ik.kneeBendB, B.ik.kneeBendB, u)
  };
  return applyIK(s, ik, canon);
}
