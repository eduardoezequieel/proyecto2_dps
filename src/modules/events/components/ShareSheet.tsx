import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import {
  Globe,
  Mail,
  MessageCircle,
  Send,
  Share2,
  X,
} from 'lucide-react-native';
import { Text } from '../../../shared/components';
import { colors, radii, spacing } from '../../../shared/theme';

export type ShareTarget = 'native' | 'whatsapp' | 'twitter' | 'facebook' | 'email';

interface ShareOption {
  target: ShareTarget;
  label: string;
  icon: React.ReactElement;
}

interface ShareSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (target: ShareTarget) => void;
}

export function ShareSheet({ visible, onClose, onSelect }: ShareSheetProps): React.ReactElement {
  const options: ShareOption[] = [
    {
      target: 'whatsapp',
      label: 'WhatsApp',
      icon: <MessageCircle size={20} color={colors.textPrimary} />,
    },
    {
      target: 'twitter',
      label: 'X / Twitter',
      icon: <Send size={20} color={colors.textPrimary} />,
    },
    {
      target: 'facebook',
      label: 'Facebook',
      icon: <Globe size={20} color={colors.textPrimary} />,
    },
    {
      target: 'email',
      label: 'Correo electronico',
      icon: <Mail size={20} color={colors.textPrimary} />,
    },
    {
      target: 'native',
      label: 'Mas opciones del sistema',
      icon: <Share2 size={20} color={colors.textPrimary} />,
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <View style={styles.header}>
            <Text variant="h2" color="textPrimary">
              Compartir evento
            </Text>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Cerrar selector de compartir"
            >
              <X size={20} color={colors.textSecondary} />
            </Pressable>
          </View>
          {options.map((option) => (
            <Pressable
              key={option.target}
              onPress={() => {
                onSelect(option.target);
              }}
              accessibilityRole="button"
              accessibilityLabel={`Compartir por ${option.label}`}
              style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
            >
              {option.icon}
              <Text variant="body" color="textPrimary" style={styles.optionLabel}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionPressed: { opacity: 0.6 },
  optionLabel: { marginLeft: spacing.md, flex: 1 },
});
