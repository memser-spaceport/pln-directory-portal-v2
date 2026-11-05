'use client';

import clsx from 'clsx';
import type { ReactNode } from 'react';

import sortCss from '@/components/common/filters/SortDropdown/SortDropdown.module.scss';

import s from './HomeV2.module.scss';

/**
 * The tag scope, on a row of its own under the pills (LAB-3125; the news page reuses it, LAB-3126): a chip with × per
 * tag (a story must carry all of them), the count, `single` for a one-tag scope or Clear all from two, then the
 * commonest other tags still in scope.
 */
export function TagScopeRow({
  tags,
  count,
  noun,
  onRemove,
  onClear,
  narrowBy,
  onNarrow,
  single = null,
}: {
  tags: string[];
  /** What the scope holds now. */
  count: number;
  /** The count's noun, singular and plural: Network Updates counts updates, the news page stories. */
  noun: [string, string];
  onRemove: (tag: string) => void;
  onClear: () => void;
  /** "Narrow by" suggestions; none hides the group. */
  narrowBy: string[];
  onNarrow: (tag: string) => void;
  /** What a one-tag scope offers in place of Clear all (Network Updates: Follow the tag). */
  single?: ReactNode;
}) {
  return (
    <div className={s.tagScope}>
      <span className={sortCss.sortByLabel}>Filter:</span>
      {tags.map((tag) => (
        <span key={tag} className={clsx(s.savedView, s.savedFilterChip, s.scopeChip)}>
          <span className={clsx(s.savedViewBody, s.scopeChipLabel)}>
            <strong>#{tag}</strong>
          </span>
          <button
            type="button"
            className={s.savedViewDelete}
            aria-label={`Stop filtering by #${tag}`}
            onClick={() => onRemove(tag)}
          >
            <svg viewBox="0 0 12 12" fill="none" aria-hidden>
              <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </span>
      ))}
      <span className={s.topicCount}>
        {count} {count === 1 ? noun[0] : noun[1]}
      </span>
      {tags.length === 1 ? (
        single
      ) : (
        <button type="button" className={s.inlineLink} onClick={onClear}>
          Clear all
        </button>
      )}
      {narrowBy.length > 0 && (
        <span className={s.tagSuggest}>
          <span className={s.tagSuggestLabel}>Narrow by</span>
          {narrowBy.map((tag) => (
            <button
              key={tag}
              type="button"
              className={s.tagAdd}
              aria-label={`Also filter by #${tag}`}
              onClick={() => onNarrow(tag)}
            >
              + #{tag}
            </button>
          ))}
        </span>
      )}
    </div>
  );
}
