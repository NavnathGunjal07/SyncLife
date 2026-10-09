export const colors = {
  background: '#0F0D12',
  surface: '#1A171F',
  surfaceAlt: '#25212C',
  /** Brand orange. Fills on this use `onAccent` text. */
  accent: '#FF7A1A',
  accentMuted: '#4A2412',
  /** Amber — second half of the brand gradient. */
  accent2: '#FFB81F',
  /** Electric violet for small, cool-contrast highlights. Use sparingly. */
  pop: '#8B6CFF',
  /** Text/icon color on top of `accent` fills. */
  onAccent: '#140A04',
  text: '#FBF8F5',
  textMuted: '#A39DAD',
  border: '#2E2935',
  danger: '#FF4D4D',
  warning: '#FFB020'
} as const;

/** Two-stop gradients ([start, end]) for buttons, rings, hero cards and the logo. */
export const gradients = {
  brand: ['#FF451A', '#FFB81F'],
  ember: ['#FF451A', '#FF7A1A'],
  ocean: ['#3DD9FF', '#6D5BFF'],
  violet: ['#6D5BFF', '#B57CFF']
} as const satisfies Record<string, readonly [string, string]>;

/** Per-metric accent colors used for icon badges and progress indicators. */
export const tints = {
  calorie: '#FF7A1A',
  water: '#3DD9FF',
  workout: '#8B6CFF',
  spend: '#FFC53D',
  gold: '#FFD60A',
  streak: '#FF4D4D'
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32
} as const;

export const radius = {
  sm: 12,
  md: 16,
  lg: 22,
  pill: 999
} as const;

export const typography = {
  title: 28,
  section: 20,
  body: 16,
  small: 14,
  caption: 12
} as const;

export const cardStyle = {
  borderRadius: radius.lg,
  borderWidth: 1,
  borderColor: colors.border,
  backgroundColor: colors.surface
} as const;
