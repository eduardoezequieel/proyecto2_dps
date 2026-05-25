import React from 'react';
import { Text as RNText, type TextProps as RNTextProps, type StyleProp, type TextStyle } from 'react-native';
import { colors, typography, type TypographyToken, type ColorToken } from '../theme';

interface TextProps extends RNTextProps {
  variant?: TypographyToken;
  color?: ColorToken;
  style?: StyleProp<TextStyle>;
}

export function Text({
  variant = 'body',
  color = 'textPrimary',
  style,
  children,
  ...rest
}: TextProps): React.ReactElement {
  return (
    <RNText {...rest} style={[typography[variant], { color: colors[color] }, style]}>
      {children}
    </RNText>
  );
}
