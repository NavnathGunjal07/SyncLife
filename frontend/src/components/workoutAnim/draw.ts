import { Anim, HandItem, Prop, Skeleton, Vec, View, add, dir, lerpV, mul, sub } from './rig';

/** One SVG path to paint, in draw order. */
export type Shape = { d: string; fill?: string; stroke?: string; sw?: number; op?: number };

export type Highlight = { primary: readonly string[]; secondary: readonly string[] };

export const PALETTE = {
  near: '#AEB6C2',
  far: '#737C89',
  outline: 'rgba(5,8,12,0.45)',
  idleMuscle: 'rgba(255,255,255,0.13)',
  primary: '#EF4444',
  secondary: '#F99A9A',
  hair: '#2A2420',
  equip: '#2B323C',
  equipEdge: '#6B7280',
  metal: '#9CA3AF',
  plate: '#1A1F27',
  floor: '#2D2D2D'
} as const;

const f = (n: number) => Math.round(n * 10) / 10;
const pt = (p: Vec) => `${f(p[0])} ${f(p[1])}`;
const norm = (v: Vec): Vec => {
  const l = Math.hypot(v[0], v[1]) || 1;
  return [v[0] / l, v[1] / l];
};

function circle(c: Vec, r: number): string {
  return `M ${f(c[0] - r)} ${f(c[1])} a ${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0 a ${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0 Z`;
}

/** Tapered limb: two circles joined by tangent-ish lines. */
function capsule(a: Vec, b: Vec, ra: number, rb: number): string {
  const d = norm(sub(b, a));
  const n: Vec = [-d[1], d[0]];
  if (Math.hypot(b[0] - a[0], b[1] - a[1]) < 0.5) return circle(a, Math.max(ra, rb));
  const a1 = add(a, mul(n, ra));
  const b1 = add(b, mul(n, rb));
  const b2 = sub(b, mul(n, rb));
  const a2 = sub(a, mul(n, ra));
  return `M ${pt(a1)} L ${pt(b1)} A ${f(rb)} ${f(rb)} 0 0 0 ${pt(b2)} L ${pt(a2)} A ${f(ra)} ${f(ra)} 0 0 0 ${pt(a1)} Z`;
}

function ellipse(c: Vec, axis: Vec, rx: number, ry: number): string {
  const u = norm(axis);
  const rot = (Math.atan2(u[1], u[0]) * 180) / Math.PI;
  const p1 = add(c, mul(u, rx));
  const p2 = sub(c, mul(u, rx));
  return `M ${pt(p1)} A ${f(rx)} ${f(ry)} ${f(rot)} 0 1 ${pt(p2)} A ${f(rx)} ${f(ry)} ${f(rot)} 0 1 ${pt(p1)} Z`;
}

function polygon(points: Vec[]): string {
  return `M ${points.map(pt).join(' L ')} Z`;
}

function rectPath(x: number, y: number, w: number, h: number, rot = 0): string {
  const c: Vec = [x + w / 2, y + h / 2];
  const r = (rot * Math.PI) / 180;
  const corner = (dx: number, dy: number): Vec => [
    c[0] + dx * Math.cos(r) - dy * Math.sin(r),
    c[1] + dx * Math.sin(r) + dy * Math.cos(r)
  ];
  return polygon([corner(-w / 2, -h / 2), corner(w / 2, -h / 2), corner(w / 2, h / 2), corner(-w / 2, h / 2)]);
}

// ── muscles ───────────────────────────────────────────────────────────
type Seg = 'torso' | 'ua' | 'fa' | 'th' | 'sh';
/** t0/t1: span along the segment (0 = proximal joint). off: offset toward the
 * front (side view) or lateral side (front/back views). w: half-thickness. */
type MuscleDef = { slug: string; seg: Seg; t0: number; t1: number; off: number; w: number; mirror?: boolean };

const SIDE_MUSCLES: MuscleDef[] = [
  { slug: 'gluteal', seg: 'th', t0: -0.18, t1: 0.26, off: -5.5, w: 6.5 },
  { slug: 'hamstring', seg: 'th', t0: 0.22, t1: 0.9, off: -3.2, w: 4.4 },
  { slug: 'quadriceps', seg: 'th', t0: 0.08, t1: 0.9, off: 2.6, w: 5.4 },
  { slug: 'calves', seg: 'sh', t0: 0.06, t1: 0.55, off: -2.2, w: 4.2 },
  { slug: 'tibialis', seg: 'sh', t0: 0.1, t1: 0.65, off: 2.4, w: 1.9 },
  { slug: 'upper-back', seg: 'torso', t0: 0.12, t1: 0.6, off: -6.5, w: 4.6 },
  { slug: 'lower-back', seg: 'torso', t0: 0.62, t1: 0.92, off: -7.5, w: 3 },
  { slug: 'trapezius', seg: 'torso', t0: -0.08, t1: 0.16, off: -5, w: 4 },
  { slug: 'chest', seg: 'torso', t0: 0.06, t1: 0.36, off: 6.5, w: 4.8 },
  { slug: 'obliques', seg: 'torso', t0: 0.46, t1: 0.86, off: 1, w: 4.5 },
  { slug: 'abs', seg: 'torso', t0: 0.4, t1: 0.92, off: 8, w: 2.8 },
  { slug: 'triceps', seg: 'ua', t0: 0.22, t1: 0.86, off: -2.2, w: 3.3 },
  { slug: 'biceps', seg: 'ua', t0: 0.28, t1: 0.88, off: 2.2, w: 3.3 },
  { slug: 'deltoids', seg: 'ua', t0: -0.14, t1: 0.32, off: 0, w: 6.4 },
  { slug: 'forearm', seg: 'fa', t0: 0.04, t1: 0.58, off: 0.4, w: 3.4 }
];

const FRONT_MUSCLES: MuscleDef[] = [
  { slug: 'quadriceps', seg: 'th', t0: 0.08, t1: 0.86, off: 1.2, w: 5.4 },
  { slug: 'adductors', seg: 'th', t0: 0.08, t1: 0.55, off: -4.6, w: 2.8 },
  { slug: 'calves', seg: 'sh', t0: 0.08, t1: 0.5, off: 3.2, w: 2.6 },
  { slug: 'tibialis', seg: 'sh', t0: 0.1, t1: 0.62, off: -0.6, w: 2.2 },
  { slug: 'chest', seg: 'torso', t0: 0.1, t1: 0.36, off: 7.5, w: 6.8, mirror: true },
  { slug: 'abs', seg: 'torso', t0: 0.42, t1: 0.9, off: 3.2, w: 2.8, mirror: true },
  { slug: 'obliques', seg: 'torso', t0: 0.46, t1: 0.86, off: 10.5, w: 2.6, mirror: true },
  { slug: 'trapezius', seg: 'torso', t0: -0.04, t1: 0.1, off: 8, w: 3, mirror: true },
  { slug: 'deltoids', seg: 'ua', t0: -0.14, t1: 0.3, off: 1, w: 6.6 },
  { slug: 'biceps', seg: 'ua', t0: 0.3, t1: 0.86, off: 0, w: 3.6 },
  { slug: 'forearm', seg: 'fa', t0: 0.04, t1: 0.56, off: 0.4, w: 3.4 }
];

const BACK_MUSCLES: MuscleDef[] = [
  { slug: 'gluteal', seg: 'th', t0: -0.2, t1: 0.22, off: -0.5, w: 7.5 },
  { slug: 'hamstring', seg: 'th', t0: 0.28, t1: 0.88, off: 0, w: 5.2 },
  { slug: 'calves', seg: 'sh', t0: 0.05, t1: 0.52, off: 0, w: 4.8 },
  { slug: 'trapezius', seg: 'torso', t0: -0.06, t1: 0.4, off: 0, w: 9 },
  { slug: 'upper-back', seg: 'torso', t0: 0.16, t1: 0.62, off: 8, w: 5.2, mirror: true },
  { slug: 'lower-back', seg: 'torso', t0: 0.6, t1: 0.92, off: 3, w: 2.6, mirror: true },
  { slug: 'deltoids', seg: 'ua', t0: -0.14, t1: 0.3, off: 1, w: 6.6 },
  { slug: 'triceps', seg: 'ua', t0: 0.26, t1: 0.86, off: 0, w: 3.8 },
  { slug: 'forearm', seg: 'fa', t0: 0.04, t1: 0.56, off: 0.4, w: 3.4 }
];

const MUSCLES: Record<View, MuscleDef[]> = { side: SIDE_MUSCLES, front: FRONT_MUSCLES, back: BACK_MUSCLES };

function muscleColor(slug: string, hl: Highlight): string {
  if (hl.primary.includes(slug)) return PALETTE.primary;
  if (hl.secondary.includes(slug)) return PALETTE.secondary;
  return PALETTE.idleMuscle;
}

/** Muscles lying on one segment (from→to), `lateral` flips the offset side. */
function musclesOn(seg: Seg, from: Vec, to: Vec, view: View, hl: Highlight, lateral: 1 | -1, op = 1): Shape[] {
  const v = sub(to, from);
  const segLen = Math.hypot(v[0], v[1]);
  if (segLen < 1) return [];
  const d = norm(v);
  const n: Vec = [d[1], -d[0]];
  const out: Shape[] = [];
  for (const m of MUSCLES[view]) {
    if (m.seg !== seg) continue;
    const sides: (1 | -1)[] = m.mirror ? [1, -1] : [lateral];
    for (const s of sides) {
      const c = add(add(from, mul(d, (segLen * (m.t0 + m.t1)) / 2)), mul(n, m.off * s));
      const fill = muscleColor(m.slug, hl);
      const hot = fill !== PALETTE.idleMuscle;
      out.push({ d: ellipse(c, d, Math.max(1, (segLen * (m.t1 - m.t0)) / 2), m.w), fill, op: hot ? op : op * 0.9 });
    }
  }
  return out;
}

// ── body parts ────────────────────────────────────────────────────────
const R = { uaTop: 5.6, uaBot: 4.3, faTop: 4.1, faBot: 3, hand: 3.5, thTop: 8.4, thBot: 5.8, shTop: 5.5, shBot: 3.5, foot: 3.2 };

function arm(s: Skeleton, side: 'A' | 'B', color: string, hl: Highlight, op = 1): Shape[] {
  const sh = side === 'A' ? s.shoulderA : s.shoulderB;
  const el = side === 'A' ? s.elbowA : s.elbowB;
  const ha = side === 'A' ? s.handA : s.handB;
  const lat: 1 | -1 = s.view !== 'side' && side === 'B' ? -1 : 1;
  return [
    { d: capsule(el, ha, R.faTop, R.faBot), fill: color, stroke: PALETTE.outline, sw: 0.8 },
    ...musclesOn('fa', el, ha, s.view, hl, lat, op),
    { d: capsule(sh, el, R.uaTop, R.uaBot), fill: color, stroke: PALETTE.outline, sw: 0.8 },
    ...musclesOn('ua', sh, el, s.view, hl, lat, op),
    { d: circle(ha, R.hand), fill: color, stroke: PALETTE.outline, sw: 0.8 }
  ];
}

function leg(s: Skeleton, side: 'A' | 'B', color: string, hl: Highlight, op = 1): Shape[] {
  const hp = side === 'A' ? s.hipA : s.hipB;
  const kn = side === 'A' ? s.kneeA : s.kneeB;
  const an = side === 'A' ? s.ankleA : s.ankleB;
  const to = side === 'A' ? s.toeA : s.toeB;
  const lat: 1 | -1 = s.view !== 'side' && side === 'B' ? -1 : 1;
  return [
    { d: capsule(an, to, R.foot, R.foot * 0.75), fill: color, stroke: PALETTE.outline, sw: 0.8 },
    { d: capsule(kn, an, R.shTop, R.shBot), fill: color, stroke: PALETTE.outline, sw: 0.8 },
    ...musclesOn('sh', kn, an, s.view, hl, lat, op),
    { d: capsule(hp, kn, R.thTop, R.thBot), fill: color, stroke: PALETTE.outline, sw: 0.8 },
    ...musclesOn('th', hp, kn, s.view, hl, lat, op)
  ];
}

function torso(s: Skeleton, hl: Highlight): Shape[] {
  const color = PALETTE.near;
  const up = norm(sub(s.neck, s.hip));
  const neckBase = add(s.neck, mul(up, -1));
  const shapes: Shape[] = [];
  if (s.view === 'side') {
    shapes.push({ d: capsule(s.hip, add(s.hip, mul(up, 33)), 10.5, 11.8), fill: color, stroke: PALETTE.outline, sw: 0.8 });
  } else {
    const r: Vec = [-up[1], up[0]];
    const at = (t: number, w: number): Vec => add(lerpV(s.hip, s.neck, t), mul(r, w));
    const pts: Vec[] = [at(1, 5), at(0.9, 17), at(0.62, 14), at(0.3, 11.5), at(0.05, 13.5), at(-0.12, 8), at(-0.12, -8), at(0.05, -13.5), at(0.3, -11.5), at(0.62, -14), at(0.9, -17), at(1, -5)];
    shapes.push({ d: polygon(pts), fill: color, stroke: color, sw: 4 });
    shapes.push({ d: polygon(pts), fill: 'none', stroke: PALETTE.outline, sw: 0.8 });
  }
  shapes.push(...musclesOn('torso', neckBase, s.hip, s.view, hl, 1));
  return shapes;
}

function head(s: Skeleton): Shape[] {
  const color = PALETTE.near;
  const neckTop = add(s.neck, mul(norm(sub(s.head, s.neck)), 3));
  const d = norm(sub(s.head, s.neck));
  const shapes: Shape[] = [
    { d: capsule(s.neck, neckTop, 3.8, 3.8), fill: color, stroke: PALETTE.outline, sw: 0.8 },
    { d: circle(s.head, 8.5), fill: color, stroke: PALETTE.outline, sw: 0.8 }
  ];
  if (s.view === 'side') {
    const back: Vec = [d[1], -d[0]];
    shapes.push({ d: circle(add(add(s.head, mul(d, 2.4)), mul(back, 2.6)), 7), fill: PALETTE.hair });
  } else if (s.view === 'front') {
    shapes.push({ d: ellipse(add(s.head, mul(d, 4.2)), [-d[1], d[0]], 7.8, 4.6), fill: PALETTE.hair });
  } else {
    shapes.push({ d: circle(add(s.head, mul(d, 1)), 8.2), fill: PALETTE.hair });
  }
  return shapes;
}

// ── equipment ─────────────────────────────────────────────────────────
function handItem(item: HandItem, at: Vec, view: View, near: boolean): Shape[] {
  const side = view === 'side';
  switch (item) {
    case 'barbell':
      return side
        ? near
          ? [
              { d: circle(at, 13), fill: PALETTE.plate, stroke: PALETTE.metal, sw: 1.4 },
              { d: circle(at, 2.4), fill: PALETTE.metal }
            ]
          : []
        : [];
    case 'dumbbell':
      return side
        ? [
            { d: circle(at, 5.6), fill: PALETTE.plate, stroke: PALETTE.metal, sw: 1.2 },
            { d: circle(at, 1.6), fill: PALETTE.metal }
          ]
        : [
            { d: rectPath(at[0] - 8, at[1] - 1.2, 16, 2.4), fill: PALETTE.metal },
            { d: rectPath(at[0] - 9.5, at[1] - 5, 3.6, 10), fill: PALETTE.plate, stroke: PALETTE.metal, sw: 1 },
            { d: rectPath(at[0] + 5.9, at[1] - 5, 3.6, 10), fill: PALETTE.plate, stroke: PALETTE.metal, sw: 1 }
          ];
    case 'backpack':
      return [{ d: rectPath(at[0] - 6, at[1] - 1, 12, 14), fill: '#1D4ED8', stroke: '#0B1B4D', sw: 1.2 }];
    case 'bottle':
      return [{ d: rectPath(at[0] - 2.4, at[1] - 7, 4.8, 13), fill: '#38BDF8', stroke: '#075985', sw: 1, op: 0.9 }];
  }
}

function frontalBarbell(s: Skeleton): Shape[] {
  const d = norm(sub(s.handA, s.handB));
  const a = add(s.handA, mul(d, 36));
  const b = sub(s.handB, mul(d, 36));
  const plate = (c: Vec) => ({ d: rectPath(c[0] - 3.5, c[1] - 14, 7, 28, (Math.atan2(d[1], d[0]) * 180) / Math.PI), fill: PALETTE.plate, stroke: PALETTE.metal, sw: 1.2 });
  return [
    { d: `M ${pt(a)} L ${pt(b)}`, stroke: PALETTE.metal, sw: 2.6, fill: 'none' },
    plate(sub(a, mul(d, 6))),
    plate(add(b, mul(d, 6)))
  ];
}

function staticProp(p: Prop): Shape[] {
  switch (p.kind) {
    case 'rect':
      return [{ d: rectPath(p.x, p.y, p.w, p.h, p.rot), fill: PALETTE.equip, stroke: PALETTE.equipEdge, sw: 1.2 }];
    case 'line':
      return [{ d: `M ${pt(p.a)} L ${pt(p.b)}`, stroke: PALETTE.equipEdge, sw: p.w ?? 3, fill: 'none' }];
    case 'circle':
      return [{ d: circle(p.c, p.r), stroke: PALETTE.equipEdge, sw: 2.6, fill: 'none' }];
    default:
      return [];
  }
}

function dynamicProp(p: Prop, s: Skeleton, phase: number): Shape[] {
  switch (p.kind) {
    case 'cable': {
      const mid = s.view === 'side' ? s.handA : lerpV(s.handA, s.handB, 0.5);
      const shapes: Shape[] = [{ d: `M ${pt(p.from)} L ${pt(mid)}`, stroke: p.band ? '#F59E0B' : PALETTE.metal, sw: p.band ? 2.2 : 1.2, fill: 'none' }];
      if (s.view !== 'side') shapes.push({ d: `M ${pt(add(s.handB, [-5, 0]))} L ${pt(add(s.handA, [5, 0]))}`, stroke: p.band ? '#F59E0B' : PALETTE.metal, sw: 2.4, fill: 'none' });
      return shapes;
    }
    case 'rope': {
      const mid = lerpV(s.handA, s.handB, 0.5);
      const c = Math.cos(2 * Math.PI * phase);
      const y = mid[1] + (c > 0 ? -150 : -120) * c;
      return [{ d: `M ${pt(s.handB)} Q ${f(mid[0])} ${f(y)} ${pt(s.handA)}`, stroke: '#F59E0B', sw: 1.6, fill: 'none' }];
    }
    case 'platform': {
      const shin = norm(sub(s.ankleA, s.kneeA));
      const c = add(lerpV(s.ankleA, s.toeA, 0.4), mul(shin, 4.5));
      const rot = (Math.atan2(shin[1], shin[0]) * 180) / Math.PI;
      return [{ d: rectPath(c[0] - 3, c[1] - 15, 6, 30, rot), fill: PALETTE.equip, stroke: PALETTE.equipEdge, sw: 1.2 }];
    }
    case 'crank':
      return [
        { d: circle(p.c, p.r), stroke: PALETTE.equipEdge, sw: 2, fill: 'none' },
        { d: `M ${pt(s.ankleA)} L ${pt(p.c)} L ${pt(s.ankleB)}`, stroke: PALETTE.metal, sw: 2, fill: 'none' }
      ];
    default:
      return [];
  }
}

/** Every path for one animation frame, back to front. */
export function drawFrame(anim: Anim, s: Skeleton, phase: number, hl: Highlight): Shape[] {
  const props = anim.props ?? [];
  const handProp = props.find((p): p is Extract<Prop, { kind: 'hand' }> => p.kind === 'hand');
  const shapes: Shape[] = [
    { d: 'M 14 186 L 186 186', stroke: PALETTE.floor, sw: 1.5, fill: 'none' },
    { d: ellipse([s.hip[0], 187], [1, 0], 34, 2.6), fill: 'rgba(0,0,0,0.45)' }
  ];
  props.forEach((p) => shapes.push(...staticProp(p)));

  if (s.view === 'side') {
    if (handProp) shapes.push(...handItem(handProp.item, s.handB, 'side', false));
    shapes.push(...arm(s, 'B', PALETTE.far, hl, 0.7));
    shapes.push(...leg(s, 'B', PALETTE.far, hl, 0.7));
    shapes.push(...torso(s, hl));
    shapes.push(...leg(s, 'A', PALETTE.near, hl));
    shapes.push(...head(s));
    props.filter((p) => p.kind === 'platform' || p.kind === 'crank').forEach((p) => shapes.push(...dynamicProp(p, s, phase)));
    shapes.push(...arm(s, 'A', PALETTE.near, hl));
    if (handProp) shapes.push(...handItem(handProp.item, s.handA, 'side', true));
  } else {
    shapes.push(...leg(s, 'A', PALETTE.near, hl));
    shapes.push(...leg(s, 'B', PALETTE.near, hl));
    shapes.push(...torso(s, hl));
    shapes.push(...head(s));
    shapes.push(...arm(s, 'A', PALETTE.near, hl));
    shapes.push(...arm(s, 'B', PALETTE.near, hl));
    if (handProp?.item === 'barbell') shapes.push(...frontalBarbell(s));
    else if (handProp) {
      shapes.push(...handItem(handProp.item, s.handA, s.view, true));
      shapes.push(...handItem(handProp.item, s.handB, s.view, true));
    }
  }
  props.filter((p) => p.kind === 'cable' || p.kind === 'rope').forEach((p) => shapes.push(...dynamicProp(p, s, phase)));
  return shapes;
}

export { dir };
