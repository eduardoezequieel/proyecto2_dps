type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const isDev = __DEV__;

function emit(level: LogLevel, scope: string, message: string, data?: unknown): void {
  if (!isDev && level === 'debug') return;
  const payload = data !== undefined ? `${message} ${safeStringify(data)}` : message;
  const tag = `[${scope}]`;
  if (level === 'error') console.error(tag, payload);
  else if (level === 'warn') console.warn(tag, payload);
  else if (isDev) console.warn(tag, payload);
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return '[unserializable]';
  }
}

export const logger = {
  debug: (scope: string, message: string, data?: unknown): void =>
    emit('debug', scope, message, data),
  info: (scope: string, message: string, data?: unknown): void =>
    emit('info', scope, message, data),
  warn: (scope: string, message: string, data?: unknown): void =>
    emit('warn', scope, message, data),
  error: (scope: string, message: string, data?: unknown): void =>
    emit('error', scope, message, data),
};
