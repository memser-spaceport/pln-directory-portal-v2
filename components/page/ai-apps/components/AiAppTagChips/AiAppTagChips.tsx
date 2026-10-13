'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { clsx } from 'clsx';

import { Tooltip } from '@/components/core/tooltip/tooltip';
import { Tag } from '@/components/ui/Tag';
import { useAiAppTags } from '@/services/ai-apps/hooks/useAiAppTags';

import { visibleTagCount } from './fitFirstRow';
import s from './AiAppTagChips.module.scss';

interface Props {
  tags: string[] | undefined;
  className?: string;
}

/**
 * An app's tags, on one row, ending in `+n` when they do not all fit.
 *
 * **One row, because the card is a column of rows.** Tags wrapped to three lines
 * on a five-tag app, pushing the metrics and author rows down and making cards
 * in the same grid different heights — over a difference nobody reads. A card is
 * scanned by its title and its description; the tags are a texture.
 *
 * **Measured, not a fixed count.** The teams listing shows a fixed two and
 * counts the rest (`TeamsTagsList`), which works there because that is the whole
 * of its layout. Here the labels are category names of very different widths —
 * "AI Agents & Automation" beside "Network & People" — so no constant fills one
 * row on every card at every breakpoint. The row is laid out, measured, and cut.
 *
 * **The visual is the teams listing's**, via the shared `Tag`. That component is
 * not reused wholesale: it takes `ITag` objects carrying `color` and `icon`, and
 * these are string codes resolved through `useAiAppTags`. The primitive is the
 * shared part; the data shapes stay their own.
 */
export function AiAppTagChips({ tags, className }: Props) {
  const { getLabel } = useAiAppTags();
  const listRef = useRef<HTMLUListElement>(null);
  /**
   * `null` until measured — NOT `tags.length`.
   *
   * Starting at "all of them" paints every row for a frame before the cut, which
   * is the three-row card this exists to remove, flashing once per mount. The
   * list renders hidden for that frame instead; see `.measuring`.
   */
  const [visible, setVisible] = useState<number | null>(null);

  const total = tags?.length ?? 0;

  /* Layout effect, not `useEffect`: the measure and the cut have to land in the
     same paint as the hidden row, or the flash comes back. */
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list || total === 0) return;

    const measure = () => {
      const items = [...list.querySelectorAll<HTMLElement>('[data-tag-chip]')];
      setVisible(
        visibleTagCount(
          items.map((item) => item.offsetTop),
          total,
        ),
      );
    };

    /* Measured against the FULL row, so the cut is re-derived from scratch every
       time rather than from the last cut — otherwise a card that narrows and
       widens again never gets its tags back. */
    setVisible(null);
    measure();

    /* Guarded, not assumed. Four existing card suites render this component, and
       jsdom ships no `ResizeObserver` — without this they all throw on a tag row
       that is incidental to every one of them. The measure above has already
       run, so the cut is correct at mount either way; what is lost without an
       observer is only re-cutting when the card resizes. */
    if (typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(measure);
    observer.observe(list);
    return () => observer.disconnect();
  }, [total, getLabel]);

  if (!tags?.length) return null;

  const measuring = visible === null;
  const shown = measuring ? tags : tags.slice(0, visible);
  const hidden = measuring ? [] : tags.slice(visible);

  return (
    <ul ref={listRef} className={clsx(s.root, measuring && s.measuring, className)} aria-label="Tags">
      {shown.map((tag) => (
        <li key={tag} data-tag-chip className={s.chip}>
          <Tag className={s.tagPill} value={getLabel(tag)} variant="primary" tagsLength={total} />
        </li>
      ))}
      {hidden.length > 0 && (
        <li className={clsx(s.chip, s.overflowChip)}>
          <Tooltip
            asChild
            trigger={
              <div>
                <Tag className={s.tagPill} value={`+${hidden.length}`} variant="primary" tagsLength={total} />
              </div>
            }
            content={<div className={s.overflowList}>{hidden.map((tag) => getLabel(tag)).join(', ')}</div>}
          />
        </li>
      )}
    </ul>
  );
}
