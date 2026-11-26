import clsx from 'clsx';

import s from './AllEventsPage.module.scss';

export type EventsWhen = 'upcoming' | 'past';

const WHEN_LABEL: Record<EventsWhen, string> = { upcoming: 'Live & upcoming', past: 'Past' };

/**
 * "Live & upcoming | Past" (LAB-3418, the prototype's When switch): the view switch's own tabs, each with its count in
 * a badge. Past's count comes after the page has loaded, so its tab holds the badge's room while there is none, also
 * when it fails to load: the switch keeps its width.
 */
export function WhenSwitch({
  when,
  counts,
  onChange,
}: {
  when: EventsWhen;
  /** Null: the count is loading or failed to, so the tab shows no badge. */
  counts: Record<EventsWhen, number | null>;
  onChange: (when: EventsWhen) => void;
}) {
  return (
    <div className={clsx(s.viewSwitch, s.whenSwitch)} role="tablist" aria-label="When">
      {(['upcoming', 'past'] as EventsWhen[]).map((value) => {
        const count = counts[value];
        return (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={when === value}
            className={clsx(s.viewBtn, s.scopeBtn, when === value && s.viewBtnActive)}
            onClick={() => onChange(value)}
          >
            {/* The space is for the tab's name: "Past 12". */}
            {WHEN_LABEL[value]}{' '}
            {count === null ? (
              <span className={s.scopeSlot} aria-hidden />
            ) : (
              <span className={s.scopeCount}>{count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
