import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../../../shared/components';
import { colors, spacing, radii } from '../../../shared/theme';
import { EVENT_CATEGORIES, EVENT_CATEGORY_LABELS, type EventCategory } from '../types';

interface CategoryPickerProps {
  value: EventCategory;
  onChange: (category: EventCategory) => void;
}

export function CategoryPicker({ value, onChange }: CategoryPickerProps): React.ReactElement {
  return (
    <View style={styles.container}>
      <Text variant="label" color="textSecondary" style={styles.label}>
        Categoria
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {EVENT_CATEGORIES.map((category) => {
          const selected = category === value;
          return (
            <Pressable
              key={category}
              onPress={() => onChange(category)}
              style={[styles.chip, selected && styles.chipSelected]}
            >
              <Text
                variant="caption"
                color={selected ? 'background' : 'textPrimary'}
              >
                {EVENT_CATEGORY_LABELS[category]}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md },
  label: { marginBottom: spacing.sm },
  row: { paddingRight: spacing.md },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.subtle,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  chipSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
});
