import { colors } from './colors';
import { spacing } from './spacing';
import { typography } from './typography';
import { radii } from './radii';

export { colors, spacing, typography, radii };
export type { ColorToken } from './colors';
export type { SpacingToken } from './spacing';
export type { TypographyToken } from './typography';
export type { RadiusToken } from './radii';

export const theme = {
  colors,
  spacing,
  typography,
  radii,
} as const;

export type Theme = typeof theme;
