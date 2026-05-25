import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Chip } from '../../../shared/components';
import { spacing } from '../../../shared/theme';
import {
  EVENT_CATEGORIES,
  EVENT_CATEGORY_LABELS,
  type EventCategory,
} from '../types';

interface CategoryFilterChipsProps {
  value: EventCategory | null;
  onChange: (value: EventCategory | null) => void;
}

export function CategoryFilterChips({
  value,
  onChange,
}: CategoryFilterChipsProps): React.ReactElement {
  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        <Chip
          label="Todas"
          selected={value === null}
          onPress={() => onChange(null)}
          accessibilityLabel="Filtrar por todas las categorias"
        />
        {EVENT_CATEGORIES.map((category) => (
          <Chip
            key={category}
            label={EVENT_CATEGORY_LABELS[category]}
            selected={value === category}
            onPress={() => onChange(category)}
            accessibilityLabel={`Filtrar por ${EVENT_CATEGORY_LABELS[category]}`}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: '100%' },
  row: { paddingVertical: spacing.xs, gap: spacing.sm },
});
