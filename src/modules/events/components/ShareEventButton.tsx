import React, { useState } from 'react';
import { Alert } from 'react-native';
import * as Linking from 'expo-linking';
import { Share2 } from 'lucide-react-native';
import { Button } from '../../../shared/components';
import {
  shareEvent,
  shareEventByEmail,
  shareEventViaFacebook,
  shareEventViaTwitter,
  shareEventViaWhatsApp,
} from '../../interactions/services/shareService';
import type { ShareEventPayload } from '../../interactions/types';
import { ShareSheet, type ShareTarget } from './ShareSheet';
import type { CommunityEvent } from '../types';

interface ShareEventButtonProps {
  event: CommunityEvent;
}

export function ShareEventButton({ event }: ShareEventButtonProps): React.ReactElement {
  const [loading, setLoading] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);

  const buildPayload = (): ShareEventPayload => ({
    eventId: event.id,
    title: event.title,
    startsAt: event.startsAt,
    locationLabel: event.location.label,
    deepLink: Linking.createURL(`/events/${event.id}`),
  });

  const handleSelect = async (target: ShareTarget): Promise<void> => {
    setSheetVisible(false);
    setLoading(true);
    const payload = buildPayload();
    let result;
    switch (target) {
      case 'native':
        result = await shareEvent(payload);
        break;
      case 'email':
        result = await shareEventByEmail(payload);
        break;
      case 'whatsapp':
        result = await shareEventViaWhatsApp(payload);
        break;
      case 'twitter':
        result = await shareEventViaTwitter(payload);
        break;
      case 'facebook':
        result = await shareEventViaFacebook(payload);
        break;
    }
    setLoading(false);
    if (!result.success && result.code === 'not-available') {
      Alert.alert(
        'No disponible',
        'No se pudo abrir esta opcion para compartir en tu dispositivo.',
      );
    }
  };

  return (
    <>
      <Button
        label="Compartir"
        variant="ghost"
        onPress={() => setSheetVisible(true)}
        loading={loading}
        fullWidth={false}
        accessibilityLabel="Compartir evento"
        accessibilityHint="Abre el selector de canales para compartir"
      />
      <ShareSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onSelect={(target) => void handleSelect(target)}
      />
    </>
  );
}

export { Share2 as ShareIcon };
