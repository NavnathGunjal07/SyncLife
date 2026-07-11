import { Archetype, archetypeFor } from '../components/ExerciseFigure';

// One verified YouTube tutorial per movement pattern (checked via oembed).
// Used only as a fallback when an exercise has no name-specific video below.
const VIDEO_BY_ARCHETYPE: Record<Archetype, string> = {
  squat: 'irA7MTz96ho',
  pushup: 'IODxDxX7oi4',
  row: 'aNUSgyWRJYA',
  curl: 'ykJmrZ5v0Oo',
  press: 'qEwKCR5JCog',
  raise: 'Y29xKcze8Ik',
  plank: 'mwlp75MS6Rg',
  crunch: 'MKmrqcoCZ-M',
  jump: 'G2hv_NYhM-A',
  run: 'u5EMsxkfswA',
  cycle: 'uHueJIjyRag',
  stretch: '9ESpoUPqpFw'
};

// Exact-exercise tutorials, keyed by lower-cased exercise name. Every id below
// was verified via YouTube oembed (video exists and the title matches the
// exercise). Home variants get their own entry so Home mode shows the right
// tutorial too.
const VIDEO_BY_NAME: Record<string, string> = {
  // ── Push ──
  'bench press': 'rT7DgCr-3pg',
  'incline dumbbell press': '8iPEnn-ltC8',
  pushups: 'IODxDxX7oi4',
  'chest fly': 'eozdVDA78K0',
  'floor fly': 'eozdVDA78K0',
  'tricep pushdown': '2-LAMcpzODU',
  'overhead tricep extension': 'YbX7Wd8jQ-Q',
  'decline pushups': 'jBH1xj-wDjk',
  'wide pushups': 'skWcxqxh2qw',
  'diamond pushups': 'J0DnG1_S92I',
  'chair dips': 'c3ZGl4pAwZ4',
  // ── Pull ──
  pullups: 'eGo4IYlbE5g',
  'towel rows': 'hXTc1mDnZCw',
  'barbell row': '9efgcAjQe7E',
  'backpack row': 'roCP6wCXPqo',
  'lat pulldown': 'CAwf7n6Luuc',
  'band pulldown': 'CAwf7n6Luuc',
  deadlift: 'VL5Ab0T07e4',
  'backpack deadlift': 'VL5Ab0T07e4',
  'bicep curl': 'ykJmrZ5v0Oo',
  'backpack curl': 'ykJmrZ5v0Oo',
  'hammer curl': 'zC3nLlEvin4',
  'backpack hammer curl': 'zC3nLlEvin4',
  // ── Legs ──
  squats: 'irA7MTz96ho',
  'bodyweight squats': 'aclHkVaku9U',
  'leg press': 'IZxyjW7MPJQ',
  'wall sit': 'y-wV4Venusw',
  'romanian deadlift': '2SHsk9AzdjA',
  'backpack rdl': '2SHsk9AzdjA',
  lunges: 'QOVaHwm-Q6U',
  'step ups': 'dQqApCGd5Ss',
  'glute bridge': 'OUgsJ8-Vi0E',
  'calf raises': 'gwLzBJYoWlI',
  // ── Shoulders & Core ──
  'shoulder press': 'qEwKCR5JCog',
  'pike pushups': 'x7_I5SUAd00',
  'lateral raise': '3VcKaXpzqRo',
  'water bottle raise': '3VcKaXpzqRo',
  'front raise': 'sOcYlBI85hc',
  'water bottle front raise': 'sOcYlBI85hc',
  'rear delt fly': 'EA7u4Q_8HQ0',
  'water bottle rear fly': 'EA7u4Q_8HQ0',
  plank: 'mwlp75MS6Rg',
  'russian twists': 'wkD8rjkodUI',
  'leg raises': 'l4kQd9eWclE',
  crunches: 'MKmrqcoCZ-M',
  // ── Full Body & Cardio ──
  'full body hiit': 'hLVh5IBsCxk',
  burpees: 'G2hv_NYhM-A',
  'mountain climbers': 'nmwgirgXLYM',
  'jumping jacks': 'c4DAnQ6DtF8',
  'jump rope': 'FJmRQ5iTXKE',
  running: 'u5EMsxkfswA',
  cycling: 'uHueJIjyRag',
  stretching: '9ESpoUPqpFw'
};

/** The YouTube video id to embed for an exercise (name override → pattern default). */
export function videoIdFor(name?: string): string {
  const key = (name ?? '').trim().toLowerCase();
  return VIDEO_BY_NAME[key] ?? VIDEO_BY_ARCHETYPE[archetypeFor(name)];
}

/** A YouTube search URL for the exact exercise (used as a "more videos" link). */
export function youtubeSearchUrl(name: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`how to ${name} proper form`)}`;
}
