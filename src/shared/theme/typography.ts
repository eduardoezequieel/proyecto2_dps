import type { TextStyle } from 'react-native';

export const typography: Record<TypographyToken, TextStyle> = {
  display: { fontSize: 32, fontWeight: '700', letterSpacing: -1, lineHeight: 38 },
  h1: { fontSize: 26, fontWeight: '700', letterSpacing: -0.5, lineHeight: 32 },
  h2: { fontSize: 22, fontWeight: '600', lineHeight: 28 },
  h3: { fontSize: 18, fontWeight: '600', lineHeight: 24 },
  body: { fontSize: 16, fontWeight: '400', lineHeight: 22 },
  bodyBold: { fontSize: 16, fontWeight: '600', lineHeight: 22 },
  caption: { fontSize: 13, fontWeight: '400', lineHeight: 18 },
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    lineHeight: 16,
  },
};

export type TypographyToken =
  | 'display'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'body'
  | 'bodyBold'
  | 'caption'
  | 'label';
