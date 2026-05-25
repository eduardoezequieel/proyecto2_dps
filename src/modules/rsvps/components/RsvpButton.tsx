import React, { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../../shared/components';
import { colors, radii, spacing } from '../../../shared/theme';
import { useAuth } from '../../../shared/hooks/useAuth';
import { useRsvpsStore } from '../stores/useRsvpsStore';
import { RSVP_STATUS_LABELS, type RsvpStatus } from '../types';
import type { CommunityEvent } from '../../events/types';

interface RsvpButtonProps {
  event: CommunityEvent;
}

const OPTIONS: ReadonlyArray<RsvpStatus> = ['going', 'maybe', 'not_going'];

const OPTION_HINT: Record<RsvpStatus, string> = {
  going: 'Confirmas tu asistencia.',
  maybe: 'Aun no estoy seguro.',
  not_going: 'No podre asistir.',
};

export function RsvpButton({ event }: RsvpButtonProps): React.ReactElement | null {
  const { user } = useAuth();
  const myRsvp = useRsvpsStore((state) => state.myRsvpByEvent[event.id]);
  const fetchMyRsvp = useRsvpsStore((state) => state.fetchMyRsvp);
  const setMyRsvp = useRsvpsStore((state) => state.setMyRsvp);
  const error = useRsvpsStore((state) => state.error);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (myRsvp) return;
    void fetchMyRsvp(event.id, user.uid);
  }, [user, event.id, myRsvp, fetchMyRsvp]);

  if (!user) return null;

  const currentStatus = myRsvp?.status ?? null;

  if (event.status === 'cancelled') {
    return (
      <View>
        <Text variant="label" color="textSecondary" style={styles.label}>
          Tu asistencia
        </Text>
        <Text variant="body" color="textSecondary">
          {currentStatus
            ? `Marcaste "${RSVP_STATUS_LABELS[currentStatus]}". El evento fue cancelado y la asistencia ya no puede modificarse.`
            : 'El evento fue cancelado. Ya no se puede registrar asistencia.'}
        </Text>
      </View>
    );
  }

  if (event.endsAt.getTime() < Date.now()) {
    return (
      <View>
        <Text variant="label" color="textSecondary" style={styles.label}>
          Tu asistencia
        </Text>
        <Text variant="body" color="textSecondary">
          {currentStatus
            ? `Marcaste "${RSVP_STATUS_LABELS[currentStatus]}". El evento ya finalizo y tu asistencia no puede modificarse.`
            : 'El evento ya finalizo. Ya no es posible registrar asistencia.'}
        </Text>
      </View>
    );
  }

  const handleSelect = async (status: RsvpStatus): Promise<void> => {
    setLoading(true);
    const result = await setMyRsvp({
      eventId: event.id,
      eventTitle: event.title,
      eventStartsAt: event.startsAt,
      uid: user.uid,
      userName: user.displayName ?? user.email ?? 'Usuario',
      status,
    });
    setLoading(false);
    if (!result.ok) {
      Alert.alert('No se pudo guardar tu asistencia', error ?? 'Intenta nuevamente.');
      return;
    }
    if (status === 'going' && !result.reminderScheduled) {
      if (result.reminderFailure === 'past') {
        Alert.alert(
          'Sin recordatorio',
          'Tu asistencia se guardo, pero el evento inicia en menos de 1 hora y ya no se puede programar un aviso anticipado.',
        );
      } else if (result.reminderFailure === 'denied') {
        Alert.alert(
          'Recordatorio desactivado',
          'Tu asistencia se guardo, pero no pudimos programar el recordatorio porque las notificaciones estan desactivadas. Habilitalas desde los ajustes del sistema.',
          [
            { text: 'Ahora no', style: 'cancel' },
            { text: 'Abrir ajustes', onPress: () => void Linking.openSettings() },
          ],
        );
      } else {
        Alert.alert(
          'No se pudo programar el recordatorio',
          'Tu asistencia se guardo, pero algo fallo al agendar la notificacion. Verifica que "Alarmas y recordatorios" este permitido para esta app en los ajustes del sistema.',
          [
            { text: 'Ahora no', style: 'cancel' },
            { text: 'Abrir ajustes', onPress: () => void Linking.openSettings() },
          ],
        );
      }
    }
  };

  const isFull =
    event.capacity !== null &&
    event.attendeesCount >= event.capacity &&
    currentStatus !== 'going';

  return (
    <View>
      <Text variant="label" color="textSecondary" style={styles.label}>
        ¿Vas a asistir a este evento?
      </Text>
      <View
        style={styles.list}
        accessibilityRole="radiogroup"
        accessibilityLabel="Confirmar asistencia al evento"
      >
        {OPTIONS.map((option) => {
          const active = option === currentStatus;
          const optionDisabled = loading || (option === 'going' && isFull);
          return (
            <Pressable
              key={option}
              onPress={() => void handleSelect(option)}
              disabled={optionDisabled}
              accessibilityRole="radio"
              accessibilityLabel={RSVP_STATUS_LABELS[option]}
              accessibilityHint={OPTION_HINT[option]}
              accessibilityState={{ selected: active, disabled: optionDisabled }}
              style={({ pressed }) => [
                styles.option,
                active && styles.optionActive,
                pressed && !optionDisabled && styles.pressed,
                optionDisabled && styles.disabled,
              ]}
            >
              <View style={styles.radioWrap}>
                <View style={[styles.radioOuter, active && styles.radioOuterActive]}>
                  {active ? <View style={styles.radioInner} /> : null}
                </View>
              </View>
              <View style={styles.optionText}>
                <Text variant="bodyBold" color="textPrimary">
                  {RSVP_STATUS_LABELS[option]}
                </Text>
                <Text variant="caption" color="textSecondary">
                  {OPTION_HINT[option]}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
      {isFull ? (
        <Text variant="caption" color="textMuted" style={styles.help}>
          El evento alcanzo su capacidad maxima ({event.capacity} asistentes).
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { marginBottom: spacing.md },
  list: { gap: spacing.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  optionActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentMuted,
  },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.4 },
  radioWrap: { marginRight: spacing.md },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: radii.pill,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterActive: { borderColor: colors.accent },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
  },
  optionText: { flex: 1 },
  help: { marginTop: spacing.sm },
});
