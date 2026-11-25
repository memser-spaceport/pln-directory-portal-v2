import { Button } from '@/components/common/Button';

import s from './AllEventsPage.module.scss';

/* The states every view shares (LAB-3247, task 4.2): loading, nothing matches, and the list failing to load. */

/** Three day rows of grey blocks in the List's shape, while the page streams. */
export function EventsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading events">
      {[0, 1, 2].map((i) => (
        <div key={i} className={s.skeletonDay}>
          <span className={`${s.skeletonBlock} ${s.skeletonDate}`} />
          <span className={`${s.skeletonBlock} ${s.skeletonCard}`} />
        </div>
      ))}
    </div>
  );
}

/** Copy from the prototype's Empty. */
export function EventsEmpty({ onClear }: { onClear: () => void }) {
  return (
    <div className={s.empty}>
      <p className={s.emptyTitle}>No live or upcoming events match</p>
      <p className={s.emptyText}>Try another search or filter, or see everything coming up.</p>
      <Button style="border" variant="neutral" size="s" onClick={onClear}>
        Show all events
      </Button>
    </div>
  );
}

/** The header stays above this; "Try again" reruns the server load. */
export function EventsError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className={s.empty} role="alert">
      <p className={s.emptyTitle}>Events couldn&apos;t load</p>
      <p className={s.emptyText}>Something went wrong on our side. Try again in a moment.</p>
      <Button style="border" variant="neutral" size="s" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}
