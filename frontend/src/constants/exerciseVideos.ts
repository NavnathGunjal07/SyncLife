import { Archetype, archetypeFor } from '../components/ExerciseFigure';

// One verified YouTube tutorial per movement pattern (checked via oembed). Every
// exercise resolves to its pattern's video; add name-specific overrides below to
// show an exact-exercise tutorial instead of the pattern default.
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

// Optional exact-exercise overrides, keyed by lower-cased exercise name.
const VIDEO_BY_NAME: Record<string, string> = {};

/** The YouTube video id to embed for an exercise (name override → pattern default). */
export function videoIdFor(name?: string): string {
  const key = (name ?? '').trim().toLowerCase();
  return VIDEO_BY_NAME[key] ?? VIDEO_BY_ARCHETYPE[archetypeFor(name)];
}

/** A YouTube search URL for the exact exercise (used as a "more videos" link). */
export function youtubeSearchUrl(name: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`how to ${name} proper form`)}`;
}
