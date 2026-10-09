import { Anim, HandItem, Pose, Prop, Vec } from './rig';

// Original keyframed exercise animations. Coordinates are in a 200x200 box,
// floor at y=186 (standing ankle ≈ y 182). The figure faces +x in side view.

const hand = (item: HandItem): Prop => ({ kind: 'hand', item });

const BENCH: Prop[] = [
  { kind: 'rect', x: 44, y: 140, w: 108, h: 6 },
  { kind: 'rect', x: 58, y: 146, w: 5, h: 40 },
  { kind: 'rect', x: 132, y: 146, w: 5, h: 40 }
];

const lying: Pose = { hip: [75, 129], torso: 90, head: 90, feet: [[36, 182]], kneeBend: [-0.2, -1] };

// Bike: crank centre + rotating pedals generated as 8 key poses.
const CRANK: Vec = [105, 160];
const bikeFrames: Pose[] = Array.from({ length: 8 }, (_, k) => {
  const a = (k * Math.PI) / 4;
  const pedal = (off: number): Vec => [CRANK[0] + 13 * Math.cos(a + off), CRANK[1] + 13 * Math.sin(a + off)];
  return { feet: [pedal(0), pedal(Math.PI)] };
});

const ANIMS = {
  squatBodyweight: {
    view: 'side', anchor: 'ankleA', at: [96, 182], period: 2600,
    frames: [
      { torso: 176, armA: [88, 90], legA: [0, 0] },
      { torso: 140, head: 160, armA: [92, 95], legA: [78, -28] }
    ]
  },
  squatBarbell: {
    view: 'side', anchor: 'ankleA', at: [96, 182], period: 2800, props: [hand('barbell')],
    frames: [
      { torso: 176, armA: [-58, 170], legA: [0, 0] },
      { torso: 140, head: 160, armA: [-98, 132], legA: [78, -28] }
    ]
  },
  deadlift: {
    view: 'side', anchor: 'ankleA', at: [100, 182], period: 3000, props: [hand('barbell')],
    frames: [
      { torso: 115, head: 130, armA: [0, 0], legA: [70, -25] },
      { torso: 180, armA: [0, 0], legA: [0, 0] }
    ]
  },
  rdl: {
    view: 'side', anchor: 'ankleA', at: [104, 182], period: 3000, props: [hand('barbell')],
    frames: [
      { torso: 178, armA: [0, 0], legA: [4, -2] },
      { torso: 102, head: 115, armA: [0, 0], legA: [18, -12] }
    ]
  },
  row: {
    view: 'side', anchor: 'ankleA', at: [100, 182], period: 2200, props: [hand('barbell')],
    base: { torso: 118, head: 130, legA: [25, -12] },
    frames: [{ armA: [3, 3] }, { armA: [-82, 4] }]
  },
  pushup: {
    view: 'side', anchor: 'hip', period: 2200,
    base: { hands: [[130, 182.5]], feet: [[30, 180]], elbowBend: [-1, -0.4], kneeBend: [0, 1] },
    frames: [
      { hip: [98, 150], torso: 117, head: 112 },
      { hip: [103, 169], torso: 96, head: 96 }
    ]
  },
  pushupDecline: {
    view: 'side', anchor: 'hip', period: 2200,
    props: [{ kind: 'rect', x: 10, y: 152, w: 36, h: 34 }],
    base: { hands: [[138, 182.5]], feet: [[30, 148]], elbowBend: [-1, -0.4], kneeBend: [0, 1] },
    frames: [
      { hip: [98, 142], torso: 102, head: 100 },
      { hip: [104, 158], torso: 84, head: 84 }
    ]
  },
  pike: {
    view: 'side', anchor: 'hip', period: 2400,
    base: { hands: [[140, 182.5]], feet: [[66, 180]], elbowBend: [-1, -0.5], kneeBend: [0.3, -1] },
    frames: [
      { hip: [94, 114], torso: 50, head: 40 },
      { hip: [106, 122], torso: 28, head: 20 }
    ]
  },
  bench: {
    view: 'side', anchor: 'hip', period: 2400, props: [...BENCH, hand('barbell')],
    base: { ...lying, elbowBend: [-0.3, 1] },
    frames: [{ hands: [[113, 82]] }, { hands: [[115, 113]] }]
  },
  incline: {
    view: 'side', anchor: 'hip', period: 2400,
    props: [
      { kind: 'rect', x: 75, y: 110, w: 6, h: 54, rot: -45 },
      { kind: 'rect', x: 84, y: 151, w: 40, h: 6 },
      { kind: 'rect', x: 100, y: 157, w: 6, h: 29 },
      hand('dumbbell')
    ],
    base: { hip: [100, 140], torso: -135, head: -150, feet: [[136, 182]], kneeBend: [1, -0.5], elbowBend: [-0.6, 1] },
    frames: [{ hands: [[84, 68]] }, { hands: [[86, 104]] }]
  },
  chestFly: {
    view: 'front', anchor: 'hip', period: 2600, props: [{ kind: 'rect', x: 89, y: 30, w: 22, h: 150 }, hand('dumbbell')],
    base: { hip: [100, 120], legA: [14, 2] },
    frames: [
      { armA: [40, 40], scale: { uaA: 0.32, faA: 0.32, uaB: 0.32, faB: 0.32 } },
      { armA: [92, 104] }
    ]
  },
  floorFly: {
    view: 'front', anchor: 'hip', period: 2600, props: [hand('dumbbell')],
    base: { hip: [100, 120], legA: [6, 2] },
    frames: [
      { armA: [40, 40], scale: { uaA: 0.32, faA: 0.32, uaB: 0.32, faB: 0.32 } },
      { armA: [92, 104] }
    ]
  },
  pushdown: {
    view: 'side', anchor: 'ankleA', at: [92, 182], period: 2000,
    props: [{ kind: 'line', a: [128, 6], b: [134, 6], w: 6 }, { kind: 'cable', from: [131, 8] }],
    base: { torso: 172, elbowBend: [-1, 0.3] },
    frames: [{ hands: [[112, 100]] }, { hands: [[104, 124]] }]
  },
  dips: {
    view: 'side', anchor: 'hip', period: 2200,
    props: [
      { kind: 'rect', x: 34, y: 140, w: 50, h: 6 },
      { kind: 'rect', x: 34, y: 92, w: 6, h: 48 },
      { kind: 'rect', x: 36, y: 146, w: 4, h: 40 },
      { kind: 'rect', x: 78, y: 146, w: 4, h: 40 }
    ],
    base: { torso: 178, hands: [[80, 137]], feet: [[130, 182]], elbowBend: [-1, -0.3], kneeBend: [0.2, -1] },
    frames: [{ hip: [90, 128] }, { hip: [97, 156] }]
  },
  overheadExt: {
    view: 'side', anchor: 'ankleA', at: [96, 182], period: 2200, props: [hand('dumbbell')],
    frames: [{ armA: [176, 178] }, { armA: [170, -30] }]
  },
  pullup: {
    view: 'back', anchor: 'hip', period: 2600,
    props: [{ kind: 'line', a: [30, 20], b: [170, 20], w: 3 }],
    base: { hands: [[128, 22]], elbowBend: [1, 0.4], legA: [2, 0] },
    frames: [{ hip: [100, 106] }, { hip: [100, 74] }]
  },
  pulldown: {
    view: 'back', anchor: 'hip', period: 2400,
    props: [
      { kind: 'rect', x: 78, y: 147, w: 44, h: 6 },
      { kind: 'rect', x: 97, y: 153, w: 6, h: 33 },
      { kind: 'cable', from: [100, 4] }
    ],
    base: { hip: [100, 140], legA: [6, 0], scale: { thA: 0.25, thB: 0.25 }, elbowBend: [1, 0.8] },
    frames: [{ hands: [[130, 58]] }, { hands: [[124, 100]] }]
  },
  curl: {
    view: 'side', anchor: 'ankleA', at: [96, 182], period: 2400, props: [hand('dumbbell')],
    frames: [{ armA: [2, 4] }, { armA: [4, 152] }]
  },
  legPress: {
    view: 'side', anchor: 'hip', period: 2600,
    props: [
      { kind: 'rect', x: 50, y: 108, w: 6, h: 46, rot: -55 },
      { kind: 'rect', x: 58, y: 151, w: 34, h: 6 },
      { kind: 'rect', x: 72, y: 157, w: 6, h: 29 },
      { kind: 'platform' }
    ],
    base: { hip: [72, 142], torso: -125, head: -140, kneeBend: [-0.3, -1], hands: [[80, 150]], elbowBend: [0, 1] },
    frames: [{ feet: [[133, 96]] }, { feet: [[104, 120]] }]
  },
  wallSit: {
    view: 'side', anchor: 'hip', period: 3200, props: [{ kind: 'rect', x: 58, y: 30, w: 8, h: 156 }],
    base: { torso: 180, feet: [[118, 182]], kneeBend: [1, -0.3], armA: [6, 10] },
    frames: [{ hip: [78, 147] }, { hip: [78, 145.5] }]
  },
  lunge: {
    view: 'side', anchor: 'hip', period: 2600,
    base: { torso: 180, armA: [3, 3], feet: [[124, 182], [64, 180]], kneeBend: [1, -0.3], kneeBendB: [0.3, 1], toe: 0.3 },
    frames: [{ hip: [95, 117] }, { hip: [95, 146] }]
  },
  stepUp: {
    view: 'side', anchor: 'hip', period: 2600, props: [{ kind: 'rect', x: 104, y: 150, w: 52, h: 36 }],
    base: { torso: 176, armA: [5, 6], kneeBend: [1, -0.4], kneeBendB: [1, -0.1] },
    frames: [
      { hip: [96, 117], feet: [[122, 146], [80, 182]] },
      { hip: [118, 78], feet: [[122, 146], [110, 146]] }
    ]
  },
  bridge: {
    view: 'side', anchor: 'hip', period: 2400,
    base: { feet: [[128, 182]], kneeBend: [0, -1], hands: [[104, 181]], elbowBend: [0, 1] },
    frames: [
      { hip: [88, 175], torso: -90, head: -92 },
      { hip: [88, 147], torso: -50, head: -80 }
    ]
  },
  calfRaise: {
    view: 'side', anchor: 'toeA', at: [110, 184], period: 1800,
    frames: [{ toe: 0, armA: [4, 6] }, { toe: 1, armA: [4, 6] }]
  },
  shoulderPress: {
    view: 'front', anchor: 'hip', period: 2400, props: [hand('dumbbell')],
    base: { hip: [100, 112] },
    frames: [{ armA: [92, 178] }, { armA: [166, 176] }]
  },
  lateralRaise: {
    view: 'front', anchor: 'hip', period: 2400, props: [hand('dumbbell')],
    base: { hip: [100, 112] },
    frames: [{ armA: [8, 10] }, { armA: [86, 92] }]
  },
  frontRaise: {
    view: 'side', anchor: 'ankleA', at: [92, 182], period: 2400, props: [hand('dumbbell')],
    frames: [{ armA: [4, 4] }, { armA: [94, 94] }]
  },
  rearFly: {
    view: 'back', anchor: 'hip', period: 2400, props: [hand('dumbbell')],
    base: { hip: [100, 112] },
    frames: [{ armA: [10, 16] }, { armA: [84, 94] }]
  },
  plank: {
    view: 'side', anchor: 'hip', period: 3200,
    base: { torso: 100, head: 100, armA: [0, 90], feet: [[20, 180]], kneeBend: [0, 1] },
    frames: [{ hip: [87, 160] }, { hip: [87, 157.5] }]
  },
  twist: {
    view: 'front', anchor: 'hip', period: 2000,
    props: [{ kind: 'rect', x: 40, y: 182, w: 120, h: 4 }],
    base: { hip: [100, 172], legA: [58, 128], scale: { thA: 0.45, thB: 0.45, shA: 0.85, shB: 0.85 }, elbowBend: [0, 1], elbowBendB: [0, 1] },
    frames: [
      { torso: 166, head: 172, hands: [[132, 166], [126, 168]] },
      { torso: 194, head: 188, hands: [[74, 168], [68, 166]] }
    ]
  },
  legRaise: {
    view: 'side', anchor: 'hip', period: 2600,
    base: { hip: [108, 175], torso: -90, head: -92, armA: [92, 92] },
    frames: [{ legA: [96, 96] }, { legA: [176, 176] }]
  },
  crunch: {
    view: 'side', anchor: 'hip', period: 2000,
    base: { hip: [100, 174], feet: [[140, 182]], kneeBend: [0, -1], handsTo: 'head', elbowBend: [0.5, -1] },
    frames: [
      { torso: -92, head: -94 },
      { torso: -122, head: -112 }
    ]
  },
  climbers: {
    view: 'side', anchor: 'hip', period: 900, cycle: true,
    base: { hip: [86, 146], torso: 110, head: 108, hands: [[140, 182.5]], kneeBend: [0.8, 1], toe: 0.6 },
    frames: [
      { feet: [[100, 160], [22, 180]] },
      { feet: [[22, 180], [100, 160]] }
    ]
  },
  burpee: {
    view: 'side', anchor: 'hip', period: 3600, cycle: true,
    base: { elbowBend: [-1, 0.2], kneeBend: [1, -0.2] },
    frames: [
      { hip: [100, 112], torso: 180, armA: [4, 8], feet: [[100, 182]] },
      { hip: [90, 150], torso: 122, head: 130, hands: [[122, 182.5]], feet: [[100, 182]] },
      { hip: [76, 150], torso: 112, head: 110, hands: [[122, 182.5]], feet: [[12, 180]], kneeBend: [0, 1] },
      { hip: [90, 150], torso: 122, head: 130, hands: [[122, 182.5]], feet: [[100, 182]] },
      { hip: [100, 96], torso: 180, armA: [172, 176], feet: [[102, 166]] }
    ]
  },
  squatJump: {
    view: 'side', anchor: 'hip', period: 2200,
    base: { kneeBend: [1, -0.2] },
    frames: [
      { hip: [100, 112], torso: 178, armA: [10, 20], feet: [[100, 182]] },
      { hip: [84, 142], torso: 142, head: 158, armA: [-40, -20], feet: [[100, 182]] },
      { hip: [100, 94], torso: 178, armA: [165, 170], feet: [[102, 166]] }
    ]
  },
  jacks: {
    view: 'front', anchor: 'hip', period: 1300,
    frames: [
      { hip: [100, 112], armA: [6, 6], legA: [3, 0] },
      { hip: [100, 103], armA: [95, 102], legA: [10, 6] },
      { hip: [100, 114.5], armA: [165, 172], legA: [17, 14] }
    ]
  },
  rope: {
    view: 'front', anchor: 'hip', period: 760, props: [{ kind: 'rope' }],
    base: { armA: [22, 52] },
    frames: [
      { hip: [100, 112], legA: [3, 0] },
      { hip: [100, 103], legA: [3, 6] }
    ]
  },
  run: {
    view: 'side', anchor: 'hip', period: 900, cycle: true,
    base: { torso: 172, head: 176 },
    frames: [
      { hip: [100, 115], legA: [25, 10], legB: [-25, -62], armA: [-40, 55], armB: [40, 125] },
      { hip: [100, 110], legA: [0, -6], legB: [62, -38], armA: [0, 85], armB: [0, 85] },
      { hip: [100, 115], legB: [25, 10], legA: [-25, -62], armB: [-40, 55], armA: [40, 125] },
      { hip: [100, 110], legB: [0, -6], legA: [62, -38], armB: [0, 85], armA: [0, 85] }
    ]
  },
  cycle: {
    view: 'side', anchor: 'hip', period: 1200, cycle: true,
    props: [
      { kind: 'circle', c: [58, 164], r: 21 },
      { kind: 'circle', c: [152, 164], r: 21 },
      { kind: 'line', a: [58, 164], b: [105, 160] },
      { kind: 'line', a: [105, 160], b: [90, 124] },
      { kind: 'line', a: [92, 130], b: [140, 116] },
      { kind: 'line', a: [140, 116], b: [152, 164] },
      { kind: 'line', a: [80, 122], b: [100, 122], w: 4 },
      { kind: 'line', a: [137, 110], b: [143, 116], w: 4 },
      { kind: 'crank', c: CRANK, r: 5 }
    ],
    base: { hip: [90, 116], torso: 128, head: 120, hands: [[139, 112]], elbowBend: [-0.2, 1], kneeBend: [1, -0.3] },
    frames: bikeFrames
  },
  stretch: {
    view: 'side', anchor: 'ankleA', at: [100, 182], period: 4200,
    frames: [
      { torso: 180, armA: [176, 178], legA: [0, 0] },
      { torso: 28, head: 20, armA: [12, 6], legA: [12, -2] }
    ]
  }
} satisfies Record<string, Anim>;

export type AnimKey = keyof typeof ANIMS;

// Name → animation, most specific first.
const RULES: [string[], AnimKey][] = [
  [['decline push'], 'pushupDecline'],
  [['pike'], 'pike'],
  [['pushdown'], 'pushdown'],
  [['push'], 'pushup'],
  [['dip'], 'dips'],
  [['overhead tricep'], 'overheadExt'],
  [['bench press'], 'bench'],
  [['incline'], 'incline'],
  [['rear delt', 'rear fly'], 'rearFly'],
  [['floor fly'], 'floorFly'],
  [['fly'], 'chestFly'],
  [['pullup', 'pull-up', 'pull up'], 'pullup'],
  [['pulldown'], 'pulldown'],
  [['row'], 'row'],
  [['romanian', 'rdl'], 'rdl'],
  [['deadlift'], 'deadlift'],
  [['curl'], 'curl'],
  [['bodyweight squat', 'air squat'], 'squatBodyweight'],
  [['squat'], 'squatBarbell'],
  [['leg press'], 'legPress'],
  [['wall sit'], 'wallSit'],
  [['lunge'], 'lunge'],
  [['step up'], 'stepUp'],
  [['bridge'], 'bridge'],
  [['calf'], 'calfRaise'],
  [['shoulder press', 'overhead press'], 'shoulderPress'],
  [['lateral', 'water bottle raise'], 'lateralRaise'],
  [['front raise'], 'frontRaise'],
  [['plank'], 'plank'],
  [['twist'], 'twist'],
  [['leg raise'], 'legRaise'],
  [['crunch', 'sit up', 'situp'], 'crunch'],
  [['mountain'], 'climbers'],
  [['burpee'], 'burpee'],
  [['hiit', 'jump squat'], 'squatJump'],
  [['jumping jack'], 'jacks'],
  [['jump rope', 'skipping'], 'rope'],
  [['run', 'sprint', 'jog'], 'run'],
  [['cycl', 'bike'], 'cycle'],
  [['stretch', 'mobility'], 'stretch']
];

export function animKeyFor(name: string): AnimKey {
  const n = name.toLowerCase();
  return RULES.find(([keys]) => keys.some((k) => n.includes(k)))?.[1] ?? 'squatBodyweight';
}

// Home alternatives swap the gym kit for household items.
function propsFor(name: string, base: Prop[] | undefined): Prop[] | undefined {
  const n = name.toLowerCase();
  const item: HandItem | null = n.includes('backpack') ? 'backpack' : n.includes('bottle') ? 'bottle' : null;
  let props = base;
  if (item) props = [...(props ?? []).filter((p) => p.kind !== 'hand'), hand(item)];
  if (n.includes('towel')) props = (props ?? []).filter((p) => p.kind !== 'hand');
  if (n.includes('band')) props = props?.map((p) => (p.kind === 'cable' ? { ...p, band: true } : p));
  return props;
}

const byName = new Map<string, Anim>();

/** The animation for an exercise name (memoised so frame caches are reused). */
export function animFor(name: string): Anim {
  const hit = byName.get(name);
  if (hit) return hit;
  const base: Anim = ANIMS[animKeyFor(name)];
  const props = propsFor(name, base.props);
  const anim = props === base.props ? base : { ...base, props };
  byName.set(name, anim);
  return anim;
}
