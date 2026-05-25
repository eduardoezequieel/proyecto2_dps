import React, { useState } from 'react';
import { Linking, Modal, Platform, StyleSheet, View } from 'react-native';
import * as Notifications from 'expo-notifications';
import { BellRing } from 'lucide-react-native';
import { Button, Text } from '../../../shared/components';
import { colors, radii, spacing } from '../../../shared/theme';
import { ensureNotificationPermission } from '../../rsvps/services/reminderService';

interface PermissionOnboardingProps {
  visible: boolean;
  onClose: () => void;
}

export function PermissionOnboarding({
  visible,
  onClose,
}: PermissionOnboardingProps): React.ReactElement {
  const [requesting, setRequesting] = useState(false);
  const [mustOpenSettings, setMustOpenSettings] = useState(false);

  const handleEnable = async (): Promise<void> => {
    setRequesting(true);
    try {
      const granted = await ensureNotificationPermission();
      if (granted) {
        onClose();
        return;
      }
      const settings = await Notifications.getPermissionsAsync();
      if (!settings.canAskAgain) {
        setMustOpenSettings(true);
        return;
      }
      onClose();
    } finally {
      setRequesting(false);
    }
  };

  const handleOpenSettings = (): void => {
    void Linking.openSettings();
    onClose();
    setMustOpenSettings(false);
  };

  const handleCancel = (): void => {
    setMustOpenSettings(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <BellRing size={28} color={colors.textPrimary} />
          </View>
          <Text variant="h2" style={styles.title}>
            {mustOpenSettings ? 'Habilitalas en ajustes' : 'Activa los recordatorios'}
          </Text>
          <Text variant="body" color="textSecondary" style={styles.body}>
            {mustOpenSettings
              ? 'Android ya no nos deja mostrar el aviso. Abre los ajustes del sistema y activa "Notificaciones" para esta app.'
              : 'Recibe avisos antes de los eventos a los que asistes y de los que organizas. Puedes cambiar esta opcion mas tarde desde los ajustes del sistema.'}
          </Text>
          <View style={styles.actions}>
            {mustOpenSettings ? (
              <Button label="Abrir ajustes" onPress={handleOpenSettings} />
            ) : (
              <Button
                label={requesting ? 'Solicitando...' : 'Activar notificaciones'}
                loading={requesting}
                onPress={() => void handleEnable()}
              />
            )}
            <Button
              label="Ahora no"
              variant="ghost"
              disabled={requesting}
              onPress={handleCancel}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    ...(Platform.OS === 'android' ? { paddingTop: spacing.xl } : null),
  },
  card: {
    backgroundColor: colors.background,
    borderColor: colors.borderStrong,
    borderWidth: 1,
    borderRadius: radii.subtle,
    padding: spacing.lg,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: radii.subtle,
    backgroundColor: colors.accentSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: { marginBottom: spacing.sm },
  body: { marginBottom: spacing.lg },
  actions: { gap: spacing.sm },
});
