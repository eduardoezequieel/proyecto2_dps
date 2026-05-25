import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Star } from 'lucide-react-native';
import { Text } from '../../../shared/components';
import { colors, spacing } from '../../../shared/theme';

interface RatingStarsProps {
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: number;
  label?: string;
}

export function RatingStars({
  value,
  onChange,
  readonly = false,
  size = 24,
  label,
}: RatingStarsProps): React.ReactElement {
  const stars: ReadonlyArray<number> = [1, 2, 3, 4, 5];

  return (
    <View>
      {label ? (
        <Text variant="label" color="textSecondary" style={styles.label}>
          {label}
        </Text>
      ) : null}
      <View style={styles.row}>
        {stars.map((position) => {
          const filled = position <= value;
          const star = (
            <Star
              size={size}
              color={filled ? colors.warning : colors.textMuted}
              fill={filled ? colors.warning : 'transparent'}
            />
          );
          if (readonly || !onChange) {
            return (
              <View key={position} style={styles.star}>
                {star}
              </View>
            );
          }
          return (
            <Pressable
              key={position}
              onPress={() => onChange(position)}
              hitSlop={6}
              style={styles.star}
            >
              {star}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { marginBottom: spacing.xs },
  row: { flexDirection: 'row' },
  star: { marginRight: spacing.xs },
});
