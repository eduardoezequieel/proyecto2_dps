export const colors = {
  background: '#0B0A0F',
  surface: '#16141C',
  surfaceElevated: '#1E1B26',
  textPrimary: '#FAFAFA',
  textSecondary: '#A1A1AA',
  textMuted: '#52525B',
  border: '#27252E',
  borderStrong: '#3A3744',
  accent: '#8B5CF6',
  accentSoft: '#7C3AED',
  accentSubtle: '#1E1B26',
  accentMuted: 'rgba(139, 92, 246, 0.16)',
  onAccent: '#FFFFFF',
  danger: '#F87171',
  success: '#4ADE80',
  warning: '#FBBF24',
  overlay: 'rgba(0,0,0,0.85)',
  transparent: 'transparent',
} as const;

export type ColorToken = keyof typeof colors;
