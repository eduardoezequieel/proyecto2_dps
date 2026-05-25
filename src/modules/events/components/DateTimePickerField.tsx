import React, { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { Text } from '../../../shared/components';
import { colors, radii, spacing } from '../../../shared/theme';
import { formatDateTime } from '../../../shared/utils/formatters';

type AndroidPickerMode = 'date' | 'time';

interface DateTimePickerFieldProps {
  label: string;
  value: Date | null;
  onChange: (date: Date) => void;
  minimumDate?: Date;
  error?: string | null;
}

export function DateTimePickerField({
  label,
  value,
  onChange,
  minimumDate,
  error,
}: DateTimePickerFieldProps): React.ReactElement {
  const [androidMode, setAndroidMode] = useState<AndroidPickerMode | null>(null);
  const [iosVisible, setIosVisible] = useState(false);
  const [tempDate, setTempDate] = useState<Date | null>(null);

  const open = (): void => {
    const seed = value ?? clampToMinimum(new Date(), minimumDate);
    setTempDate(seed);
    if (Platform.OS === 'ios') {
      setIosVisible(true);
    } else {
      setAndroidMode('date');
    }
  };

  const handleAndroidChange = (event: DateTimePickerEvent, picked?: Date): void => {
    if (event.type === 'dismissed' || !picked) {
      setAndroidMode(null);
      return;
    }
    if (androidMode === 'date') {
      setTempDate(picked);
      setAndroidMode('time');
      return;
    }
    if (androidMode === 'time' && tempDate) {
      const combined = new Date(tempDate);
      combined.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
      onChange(combined);
      setAndroidMode(null);
    }
  };

  const handleIosChange = (_event: DateTimePickerEvent, picked?: Date): void => {
    if (picked) setTempDate(picked);
  };

  const confirmIos = (): void => {
    if (tempDate) onChange(tempDate);
    setIosVisible(false);
  };

  const cancelIos = (): void => {
    setIosVisible(false);
  };

  return (
    <View style={styles.container}>
      <Text variant="label" color="textSecondary" style={styles.label}>
        {label}
      </Text>
      <Pressable onPress={open} style={[styles.field, error ? styles.fieldError : null]}>
        <Text variant="body" color={value ? 'textPrimary' : 'textMuted'}>
          {value ? formatDateTime(value) : 'Selecciona fecha y hora'}
        </Text>
      </Pressable>
      {error ? (
        <Text variant="caption" color="danger" style={styles.feedback}>
          {error}
        </Text>
      ) : null}

      {Platform.OS === 'android' && androidMode !== null ? (
        <DateTimePicker
          value={tempDate ?? value ?? new Date()}
          mode={androidMode}
          minimumDate={androidMode === 'date' ? minimumDate : undefined}
          is24Hour
          onChange={handleAndroidChange}
        />
      ) : null}

      {Platform.OS === 'ios' ? (
        <Modal
          visible={iosVisible}
          transparent
          animationType="fade"
          onRequestClose={cancelIos}
        >
          <Pressable style={styles.backdrop} onPress={cancelIos}>
            <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
              <View style={styles.sheetHeader}>
                <Pressable
                  onPress={cancelIos}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel="Cancelar"
                >
                  <Text variant="body" color="textSecondary">
                    Cancelar
                  </Text>
                </Pressable>
                <Text variant="bodyBold" color="textPrimary">
                  {label}
                </Text>
                <Pressable
                  onPress={confirmIos}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel="Listo"
                >
                  <Text variant="bodyBold" color="accent">
                    Listo
                  </Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={tempDate ?? value ?? new Date()}
                mode="datetime"
                display="spinner"
                minimumDate={minimumDate}
                themeVariant="dark"
                textColor={colors.textPrimary}
                onChange={handleIosChange}
              />
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </View>
  );
}

function clampToMinimum(date: Date, minimumDate: Date | undefined): Date {
  if (!minimumDate) return date;
  return date.getTime() < minimumDate.getTime() ? minimumDate : date;
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md },
  label: { marginBottom: spacing.xs },
  field: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.sm,
  },
  fieldError: { borderBottomColor: colors.danger },
  feedback: { marginTop: spacing.xs },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.subtle,
    borderTopRightRadius: radii.subtle,
    borderTopWidth: 1,
    borderColor: colors.borderStrong,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: spacing.sm,
  },
});
