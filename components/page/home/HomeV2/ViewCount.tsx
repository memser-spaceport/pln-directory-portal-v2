import { ViewIcon } from './icons';
import s from './HomeV2.module.scss';

/**
 * Thousands as "1.2k": rows run three meta items in a line that wraps on phones. Locale-independent, so the server
 * and the browser render the same string.
 */
const compactViews = (n: number): string => (n < 1000 ? String(n) : `${Math.round(n / 100) / 10}k`);

/** The "N Views" meta item on a story row (prototype newsfeed-v0 FeedActions `ViewCount`, compact). */
export function ViewCount({ count }: { count: number }) {
  return (
    <span className={s.subItem}>
      <ViewIcon /> {compactViews(count)} {count === 1 ? 'View' : 'Views'}
    </span>
  );
}
