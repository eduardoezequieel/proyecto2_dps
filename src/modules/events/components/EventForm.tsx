import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Input, Text } from '../../../shared/components';
import { spacing } from '../../../shared/theme';
import { validateEventForm } from '../../../shared/utils/validators';
import { DateTimePickerField } from './DateTimePickerField';
import { CategoryPicker } from './CategoryPicker';
import type { EventDraft, EventCategory } from '../types';

interface EventFormProps {
  initialDraft?: EventDraft;
  submitLabel: string;
  loading?: boolean;
  onSubmit: (draft: EventDraft) => void;
}

interface FormState {
  title: string;
  description: string;
  locationLabel: string;
  startsAt: Date | null;
  endsAt: Date | null;
  category: EventCategory;
  capacity: string;
}

function buildInitialState(initial?: EventDraft): FormState {
  if (!initial) {
    return {
      title: '',
      description: '',
      locationLabel: '',
      startsAt: null,
      endsAt: null,
      category: 'social',
      capacity: '',
    };
  }
  return {
    title: initial.title,
    description: initial.description,
    locationLabel: initial.location.label,
    startsAt: initial.startsAt,
    endsAt: initial.endsAt,
    category: initial.category,
    capacity: initial.capacity !== null ? String(initial.capacity) : '',
  };
}

export function EventForm({
  initialDraft,
  submitLabel,
  loading = false,
  onSubmit,
}: EventFormProps): React.ReactElement {
  const [state, setState] = useState<FormState>(buildInitialState(initialDraft));
  const [errors, setErrors] = useState<string[]>([]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]): void => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (): void => {
    const validationErrors = validateEventForm({
      title: state.title,
      description: state.description,
      locationLabel: state.locationLabel,
      startsAt: state.startsAt,
      endsAt: state.endsAt,
      capacity: state.capacity,
    });
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors([]);
    if (!state.startsAt || !state.endsAt) return;
    const draft: EventDraft = {
      title: state.title.trim(),
      description: state.description.trim(),
      location: {
        label: state.locationLabel.trim(),
        latitude: null,
        longitude: null,
      },
      startsAt: state.startsAt,
      endsAt: state.endsAt,
      category: state.category,
      capacity: state.capacity.trim().length > 0 ? Number(state.capacity) : null,
    };

    onSubmit(draft);
  };

  return (
    <View>
      <Input
        label="Titulo"
        value={state.title}
        onChangeText={(value) => update('title', value)}
        editable={!loading}
      />
      <Input
        label="Descripcion"
        value={state.description}
        onChangeText={(value) => update('description', value)}
        multiline
        numberOfLines={4}
        editable={!loading}
      />
      <Input
        label="Ubicacion"
        value={state.locationLabel}
        onChangeText={(value) => update('locationLabel', value)}
        editable={!loading}
      />
      <DateTimePickerField
        label="Inicio"
        value={state.startsAt}
        minimumDate={new Date()}
        onChange={(date) => update('startsAt', date)}
      />
      <DateTimePickerField
        label="Fin"
        value={state.endsAt}
        minimumDate={state.startsAt ?? new Date()}
        onChange={(date) => update('endsAt', date)}
      />
      <CategoryPicker
        value={state.category}
        onChange={(category) => update('category', category)}
      />
      <Input
        label="Capacidad (opcional)"
        value={state.capacity}
        onChangeText={(value) => update('capacity', value.replace(/[^0-9]/g, ''))}
        keyboardType="number-pad"
        editable={!loading}
      />
      {errors.length > 0 ? (
        <View style={styles.errors}>
          {errors.map((message) => (
            <Text key={message} variant="caption" color="danger" style={styles.errorItem}>
              {message}
            </Text>
          ))}
        </View>
      ) : null}
      <Button label={submitLabel} onPress={handleSubmit} loading={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  errors: { marginBottom: spacing.md },
  errorItem: { marginBottom: spacing.xs },
});
