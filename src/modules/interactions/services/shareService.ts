import { Share, Platform } from 'react-native';
import * as MailComposer from 'expo-mail-composer';
import { handleError } from '../../../shared/utils/errorHandler';
import { ok, fail, type AsyncResult } from '../../../shared/types/result';
import { formatDateTime } from '../../../shared/utils/formatters';
import type { ShareEventPayload } from '../types';

const SCOPE = 'shareService';

function buildShareMessage(payload: ShareEventPayload): string {
  return [
    `Te invito al evento: ${payload.title}`,
    `Fecha: ${formatDateTime(payload.startsAt)}`,
    `Lugar: ${payload.locationLabel}`,
    `Mas info: ${payload.deepLink}`,
  ].join('\n');
}

export async function shareEvent(
  payload: ShareEventPayload,
): Promise<AsyncResult<true>> {
  try {
    const message = buildShareMessage(payload);
    const options =
      Platform.OS === 'ios'
        ? { message, url: payload.deepLink }
        : { message: `${message}` };
    const result = await Share.share(options, { dialogTitle: 'Compartir evento' });
    if (result.action === Share.dismissedAction) {
      return fail('Compartir cancelado.', 'cancelled');
    }
    return ok(true);
  } catch (error) {
    const handled = handleError(error, SCOPE);
    return fail(handled.userMessage, handled.code);
  }
}

export async function shareEventByEmail(
  payload: ShareEventPayload,
): Promise<AsyncResult<true>> {
  try {
    const available = await MailComposer.isAvailableAsync();
    if (!available) {
      return fail('No hay app de correo disponible.', 'not-available');
    }
    await MailComposer.composeAsync({
      subject: `Evento: ${payload.title}`,
      body: buildShareMessage(payload),
    });
    return ok(true);
  } catch (error) {
    const handled = handleError(error, SCOPE);
    return fail(handled.userMessage, handled.code);
  }
}
