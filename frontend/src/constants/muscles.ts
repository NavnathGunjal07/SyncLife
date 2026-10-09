import type { Slug } from 'react-native-body-highlighter';

export type MuscleTargets = { primary: Slug[]; secondary: Slug[] };

// Exercise name → muscles worked, matched by substring. Order matters: more
// specific patterns come before generic ones ("leg press" before "press",
// "romanian" before "deadlift", "diamond" before "push").
const RULES: [string[], MuscleTargets][] = [
  [['diamond', 'tricep', 'dip'], { primary: ['triceps'], secondary: ['chest', 'deltoids'] }],
  [['leg press', 'squat', 'wall sit'], { primary: ['quadriceps', 'gluteal'], secondary: ['hamstring', 'adductors', 'calves'] }],
  [['pike', 'shoulder press', 'overhead press'], { primary: ['deltoids'], secondary: ['triceps', 'trapezius'] }],
  [['rear delt', 'rear fly'], { primary: ['deltoids', 'upper-back'], secondary: ['trapezius'] }],
  [['lateral', 'water bottle raise'], { primary: ['deltoids'], secondary: ['trapezius'] }],
  [['front raise'], { primary: ['deltoids'], secondary: ['chest'] }],
  [['fly'], { primary: ['chest'], secondary: ['deltoids', 'biceps'] }],
  [['push', 'bench', 'press'], { primary: ['chest'], secondary: ['triceps', 'deltoids'] }],
  [['romanian', 'rdl'], { primary: ['hamstring', 'gluteal'], secondary: ['lower-back'] }],
  [['deadlift'], { primary: ['hamstring', 'gluteal', 'lower-back'], secondary: ['quadriceps', 'trapezius', 'forearm'] }],
  [['hammer'], { primary: ['biceps', 'forearm'], secondary: [] }],
  [['curl'], { primary: ['biceps'], secondary: ['forearm'] }],
  [['pullup', 'pull-up', 'pulldown'], { primary: ['upper-back'], secondary: ['biceps', 'forearm', 'deltoids'] }],
  [['row'], { primary: ['upper-back'], secondary: ['biceps', 'trapezius', 'lower-back'] }],
  [['calf'], { primary: ['calves'], secondary: [] }],
  [['lunge', 'step up'], { primary: ['quadriceps', 'gluteal'], secondary: ['hamstring', 'calves'] }],
  [['bridge'], { primary: ['gluteal'], secondary: ['hamstring', 'lower-back'] }],
  [['plank'], { primary: ['abs'], secondary: ['obliques', 'deltoids', 'lower-back'] }],
  [['twist'], { primary: ['obliques'], secondary: ['abs'] }],
  [['leg raise'], { primary: ['abs'], secondary: ['obliques', 'quadriceps'] }],
  [['crunch', 'sit up', 'situp'], { primary: ['abs'], secondary: ['obliques'] }],
  [['mountain'], { primary: ['abs'], secondary: ['deltoids', 'quadriceps', 'obliques'] }],
  [['burpee', 'hiit'], { primary: ['quadriceps', 'chest'], secondary: ['deltoids', 'abs', 'gluteal', 'triceps', 'calves'] }],
  [['jumping jack', 'jump rope'], { primary: ['calves'], secondary: ['deltoids', 'quadriceps'] }],
  [['run', 'sprint', 'walk'], { primary: ['quadriceps', 'hamstring', 'calves'], secondary: ['gluteal'] }],
  [['cycl', 'bike'], { primary: ['quadriceps'], secondary: ['hamstring', 'calves', 'gluteal'] }],
  [['stretch', 'mobility'], { primary: ['hamstring', 'lower-back'], secondary: ['upper-back', 'adductors'] }]
];

export function musclesFor(name: string): MuscleTargets {
  const n = name.toLowerCase();
  const hit = RULES.find(([keys]) => keys.some((key) => n.includes(key)));
  return hit ? hit[1] : { primary: [], secondary: [] };
}

const BACK_MUSCLES: Slug[] = ['upper-back', 'lower-back', 'hamstring', 'gluteal', 'triceps', 'calves', 'trapezius'];

/** The body side where the exercise's main muscles are visible. */
export function bestSide(targets: MuscleTargets): 'front' | 'back' {
  const back = targets.primary.filter((m) => BACK_MUSCLES.includes(m)).length;
  return back > targets.primary.length / 2 ? 'back' : 'front';
}

/** Human-readable muscle names for labels. */
export const MUSCLE_LABEL: Partial<Record<Slug, string>> = {
  abs: 'Abs',
  adductors: 'Adductors',
  biceps: 'Biceps',
  calves: 'Calves',
  chest: 'Chest',
  deltoids: 'Shoulders',
  forearm: 'Forearms',
  gluteal: 'Glutes',
  hamstring: 'Hamstrings',
  'lower-back': 'Lower back',
  obliques: 'Obliques',
  quadriceps: 'Quads',
  trapezius: 'Traps',
  triceps: 'Triceps',
  'upper-back': 'Lats / upper back'
};
