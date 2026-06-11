export const colors = {
  background: '#0A0A0A',
  surface: '#1A1A1A',
  surfaceAlt: '#242424',
  accent: '#22C55E',
  accentMuted: '#166534',
  text: '#F9FAFB',
  textMuted: '#9CA3AF',
  border: '#2D2D2D',
  danger: '#EF4444',
  warning: '#F59E0B'
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32
} as const;

export const typography = {
  title: 28,
  section: 20,
  body: 16,
  small: 14,
  caption: 12
} as const;

export const cardStyle = {
  borderRadius: 16,
  borderWidth: 1,
  borderColor: colors.border,
  backgroundColor: colors.surface
} as const;
