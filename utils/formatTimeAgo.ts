import { formatDistanceToNow } from 'date-fns';

export function formatTimeAgo(date: string | number): string {
  try {
    return (
      formatDistanceToNow(new Date(date), { addSuffix: false })
        .replace('about ', '')
        .replace('less than a minute', '1min')
        .replace(' minutes', 'min')
        .replace(' minute', 'min')
        .replace(' hours', 'h')
        .replace(' hour', 'h')
        .replace(' days', 'd')
        .replace(' day', 'd') + ' ago'
    );
  } catch {
    return '';
  }
}
