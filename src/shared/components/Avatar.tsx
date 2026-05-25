import React from 'react';
import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { User } from 'lucide-react-native';
import { Text } from './Text';
import { colors, radii } from '../theme';

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  name?: string | null;
  uri?: string | null;
  size?: AvatarSize;
  style?: StyleProp<ViewStyle>;
}

const SIZE_PX: Record<AvatarSize, number> = {
  sm: 32,
  md: 40,
  lg: 56,
  xl: 96,
};

const TEXT_VARIANT: Record<AvatarSize, 'caption' | 'bodyBold' | 'h2' | 'display'> = {
  sm: 'caption',
  md: 'bodyBold',
  lg: 'h2',
  xl: 'display',
};

function getInitial(name?: string | null): string | null {
  if (!name) return null;
  const trimmed = name.trim();
  if (trimmed.length === 0) return null;
  return trimmed.charAt(0).toUpperCase();
}

export function Avatar({
  name,
  uri,
  size = 'md',
  style,
}: AvatarProps): React.ReactElement {
  const dimension = SIZE_PX[size];
  const containerStyle: ViewStyle = {
    width: dimension,
    height: dimension,
    borderRadius: radii.pill,
  };

  if (uri) {
    return (
      <View style={[styles.fallback, containerStyle, style]}>
        <Image
          source={{ uri }}
          style={{ width: dimension, height: dimension, borderRadius: radii.pill }}
        />
      </View>
    );
  }

  const initial = getInitial(name);

  return (
    <View style={[styles.fallback, containerStyle, style]}>
      {initial ? (
        <Text variant={TEXT_VARIANT[size]} color="accent">
          {initial}
        </Text>
      ) : (
        <User size={Math.floor(dimension * 0.5)} color={colors.accent} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: colors.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
