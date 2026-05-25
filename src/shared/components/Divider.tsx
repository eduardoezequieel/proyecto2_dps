import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, spacing } from '../theme';

interface DividerProps {
  style?: StyleProp<ViewStyle>;
  spacing?: 'sm' | 'md' | 'lg';
}

export function Divider({ style, spacing: gap = 'md' }: DividerProps): React.ReactElement {
  const gapValue = spacing[gap];
  return <View style={[styles.line, { marginVertical: gapValue }, style]} />;
}

const styles = StyleSheet.create({
  line: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, width: '100%' },
});
