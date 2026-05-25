import { Share, Platform } from 'react-native';
import * as Linking from 'expo-linking';
import * as MailComposer from 'expo-mail-composer';
import { handleError } from '../../../shared/utils/errorHandler';
import { ok, fail, type AsyncResult } from '../../../shared/types/result';
import { formatDateTime } from '../../../shared/utils/formatters';
import type { ShareEventPayload } from '../types';

const SCOPE = 'shareService';

/** Construye el mensaje de texto plano que se comparte por cualquier canal. */
export function buildShareMessage(payload: ShareEventPayload): string {
  return [
    `Te invito al evento: ${payload.title}`,
    `Fecha: ${formatDateTime(payload.startsAt)}`,
    `Lugar: ${payload.locationLabel}`,
    `Mas info: ${payload.deepLink}`,
  ].join('\n');
}

async function openExternalUrl(url: string): Promise<AsyncResult<true>> {
  try {
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      return fail('No se pudo abrir la aplicacion seleccionada.', 'not-available');
    }
    await Linking.openURL(url);
    return ok(true);
  } catch (error) {
    const handled = handleError(error, SCOPE);
    return fail(handled.userMessage, handled.code);
  }
}

/** Abre la hoja de compartir nativa del sistema (iOS / Android). */
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

/** Abre el composer de correo si hay app de correo disponible. Codigo `'not-available'` si no. */
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

/** Abre WhatsApp con el mensaje precargado via `wa.me`. Funciona en mobile y web. */
export function shareEventViaWhatsApp(
  payload: ShareEventPayload,
): Promise<AsyncResult<true>> {
  const text = encodeURIComponent(buildShareMessage(payload));
  return openExternalUrl(`https://wa.me/?text=${text}`);
}

/** Abre el composer de X/Twitter via `twitter.com/intent/tweet`. */
export function shareEventViaTwitter(
  payload: ShareEventPayload,
): Promise<AsyncResult<true>> {
  const text = encodeURIComponent(
    `Te invito al evento: ${payload.title} (${formatDateTime(payload.startsAt)} - ${payload.locationLabel})`,
  );
  const url = encodeURIComponent(payload.deepLink);
  return openExternalUrl(`https://twitter.com/intent/tweet?text=${text}&url=${url}`);
}

/** Abre el dialogo de compartir de Facebook via `sharer.php`. */
export function shareEventViaFacebook(
  payload: ShareEventPayload,
): Promise<AsyncResult<true>> {
  const url = encodeURIComponent(payload.deepLink);
  return openExternalUrl(`https://www.facebook.com/sharer/sharer.php?u=${url}`);
}
