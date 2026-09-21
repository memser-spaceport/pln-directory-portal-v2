'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from 'react';

// The teams list's chip: the design system `Tag`, primary variant. It owns the
// padding, radius, tone and type, so nothing here restates them.
import { Tag } from '@/components/ui/Tag';
/**
 * The IRL attendee list's popover, for the "+n" only: it anchors and opens the
 * same way a tooltip does, but its content supplies its own surface (that's how
 * the "Host" list renders as a white card).
 */
import { Tooltip as Popover } from '@/components/page/irl/attendee-list/attendee-popover';

import { getTagLabel } from './mocks';

import s from './AiAppTagChips.module.scss';

interface Props {
  readonly tags: string[] | undefined;
  readonly className?: string;
}

/** Keep a press on the "+n" from reaching the card underneath and opening the app. */
const swallow = (e: MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
};

/**
 * An app's tags: the teams list's row — `Tag variant="primary"` chips followed
 * by a "+n" in the same lineage — over the tags dev added to `AiApp`.
 *
 * Two deliberate departures from `TeamsTagsList`, both so a label is never cut:
 *
 *  - **No truncation.** The teams chip caps itself at 74px, which is what lets
 *    that card show a fixed two per row whatever the labels say — at the cost
 *    of "Directory data" reading as "Director…". A tag is a word chosen to be
 *    recognised, so half of one is worth less than not showing it at all; the
 *    cap comes off and the "+n" carries the difference.
 *  - **The count follows the width** rather than being 2 on desktop and 1 on a
 *    phone. Once chips size to their own labels, a fixed count is the thing
 *    that would overflow, so the row fits as many whole chips as it has room
 *    for and hands the rest to the "+n". That also covers the breakpoints the
 *    teams card splits by hand.
 *
 * The per-chip tooltip goes with the truncation: it existed to give back a
 * label the chip had cut, and there is nothing left for it to say.
 */
export function AiAppTagChips({ tags, className }: Props) {
  const rowRef = useRef<HTMLDivElement>(null);
  /**
   * Natural chip widths, measured once on the pass where every chip is in flow.
   * A chip's text never changes, so a resize only re-runs the arithmetic — no
   * second layout pass, and no flicker of the full row while we re-measure.
   */
  const measured = useRef<{ chips: number[]; more: number; gap: number } | null>(null);
  /** null = the measuring pass: render everything, including the "+n" ghost. */
  const [visible, setVisible] = useState<number | null>(null);

  const labels = (tags ?? []).map(getTagLabel);
  const count = labels.length;

  const fit = useCallback(() => {
    const row = rowRef.current;
    const m = measured.current;
    if (!row || !m) return;

    const available = row.clientWidth;
    let used = 0;
    let n = 0;
    for (let i = 0; i < m.chips.length; i += 1) {
      const next = used + (i === 0 ? 0 : m.gap) + m.chips[i];
      // Anything we stop before still has to be reachable, so every chip but
      // the last is measured with room for the "+n" beside it.
      const reserve = i === m.chips.length - 1 ? 0 : m.gap + m.more;
      if (next + reserve > available) break;
      used = next;
      n = i + 1;
    }
    // Never a bare "+n": a row that shows no tag at all has stopped being a tag row.
    setVisible(Math.max(n, 1));
  }, []);

  useLayoutEffect(() => {
    const row = rowRef.current;
    if (!row) return;

    const items = Array.from(row.children) as HTMLElement[];
    const chips = items.slice(0, count).map((el) => el.getBoundingClientRect().width);
    // The ghost is a plain chip, not the real "+n": the popover wraps its
    // trigger in a mobile div and a desktop div (one of them display:none), so
    // the live chip is two children wide, one of them zero.
    const more = items[count]?.getBoundingClientRect().width ?? 0;
    const gap = parseFloat(getComputedStyle(row).columnGap) || 8;

    measured.current = { chips, more, gap };
    fit();
  }, [count, fit]);

  useEffect(() => {
    const row = rowRef.current;
    if (!row || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => fit());
    observer.observe(row);
    return () => observer.disconnect();
  }, [fit]);

  if (!count) return null;

  const shown = visible === null ? labels : labels.slice(0, visible);
  const hidden = labels.slice(shown.length);

  return (
    <div ref={rowRef} className={`${s.row} ${className ?? ''}`}>
      {shown.map((label) => (
        <Tag key={label} value={label} variant="primary" />
      ))}

      {/* Measuring pass only — gives `fit` the width of the chip it must reserve. */}
      {visible === null && count > 1 && (
        <span aria-hidden>
          <Tag value={`+${count - 1}`} variant="primary" />
        </span>
      )}

      {hidden.length > 0 && (
        <Popover
          asChild
          trigger={
            <div
              className={s.more}
              onClick={swallow}
              aria-label={`${hidden.length} more tags: ${hidden.join(', ')}`}
            >
              <Tag value={`+${hidden.length}`} variant="primary" />
            </div>
          }
          content={
            /* The one thing not taken from the teams list, which puts the rest
               in the black tooltip as comma-separated text. That holds two short
               industry tags; an app carrying eight tags as long as "Meeting
               productivity" turns it into a paragraph. Same trigger and gesture,
               a white card holding the remainder as the chips they are. */
            <ul className={s.panel} aria-label="More tags">
              {hidden.map((label) => (
                <li key={label}>
                  <Tag value={label} variant="primary" />
                </li>
              ))}
            </ul>
          }
        />
      )}
    </div>
  );
}
