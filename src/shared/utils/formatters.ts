const DATE_LOCALE = 'es-SV';

export function formatDate(date: Date): string {
  return date.toLocaleDateString(DATE_LOCALE, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString(DATE_LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateTime(date: Date): string {
  return `${formatDate(date)} - ${formatTime(date)}`;
}

export function formatRelativeTime(date: Date, reference: Date = new Date()): string {
  const diffMs = date.getTime() - reference.getTime();
  const diffMin = Math.round(diffMs / 60000);
  const absMin = Math.abs(diffMin);

  if (absMin < 1) return 'ahora';
  if (absMin < 60) return diffMin > 0 ? `en ${absMin} min` : `hace ${absMin} min`;

  const diffHours = Math.round(diffMin / 60);
  const absHours = Math.abs(diffHours);
  if (absHours < 24) {
    return diffHours > 0 ? `en ${absHours} h` : `hace ${absHours} h`;
  }

  const diffDays = Math.round(diffHours / 24);
  const absDays = Math.abs(diffDays);
  if (absDays < 30) {
    return diffDays > 0 ? `en ${absDays} dias` : `hace ${absDays} dias`;
  }

  return formatDate(date);
}

export function getDurationLabel(start: Date, end: Date): string {
  const diffMin = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
  const hours = Math.floor(diffMin / 60);
  const minutes = diffMin % 60;
  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} h`;
  return `${hours} h ${minutes} min`;
}
