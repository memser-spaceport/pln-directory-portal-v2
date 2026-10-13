'use client';

import clsx from 'clsx';

import { ArrowUpRightIcon } from '@/components/icons';
// Production row classes, so a suggestion is drawn as the row it sits among:
// the AI view's "Try asking" prompts, or the popover's AI band row.
import tt from '@/components/core/application-search/components/TryToSearch/TryToSearch.module.scss';
import rs from '@/components/core/application-search/components/RecentSearch/RecentSearch.module.scss';

import { suggestionSegments, suggestionTokens, type QuerySuggestion } from './suggestions';
import s from './QuerySuggestions.module.scss';

interface QuerySuggestionsProps {
  suggestions: QuerySuggestion[];
  /** What was typed; its word-starts are painted in each row. */
  query: string;
  onPick: (text: string) => void;
  /**
   * `prompts`: the AI view — the same rows as "Try asking", which these stand
   * in for while you type. `band`: the popover's AI band, under its "Chat with
   * AI Search about …" row, wearing that row's chrome.
   */
  variant: 'prompts' | 'band';
  /** The row the arrow keys are on (AI view only). */
  activeIndex?: number;
  /** For `aria-activedescendant` on the field. */
  idPrefix?: string;
}

/**
 * Questions offered while typing. No new row: each variant is the row already
 * on that surface (a suggestion is a prompt that happens to match what you
 * typed), with the typed word-starts in the results' own match blue.
 */
export function QuerySuggestions({
  suggestions,
  query,
  onPick,
  variant,
  activeIndex = -1,
  idPrefix = 'query-suggestion',
}: QuerySuggestionsProps) {
  const tokens = suggestionTokens(query);
  const band = variant === 'band';

  return (
    <ul className={clsx(band ? s.bandList : tt.list)} role="listbox" aria-label="Suggested questions">
      {suggestions.map((item, i) => (
        <li key={item.text} role="presentation">
          <button
            type="button"
            id={`${idPrefix}-${i}`}
            role="option"
            aria-selected={i === activeIndex}
            className={clsx(
              band ? [rs.searchItem, s.bandRow] : [tt.suggestionButton, s.promptRow],
              i === activeIndex && s.active,
            )}
            /* Keep the caret in the field: a press on a row is not a reason
               for the input to blur (and, in the header, collapse) first. */
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onPick(item.text)}
          >
            <img src={item.icon} alt="" className={s.icon} />
            <span className={clsx(band && rs.searchItemText, s.text)}>
              {suggestionSegments(item.text, tokens).map((seg, j) =>
                seg.match ? (
                  <em key={j} className={s.match}>
                    {seg.text}
                  </em>
                ) : (
                  <span key={j}>{seg.text}</span>
                ),
              )}
            </span>
            {band && (
              <span className={s.arrow} aria-hidden="true">
                <ArrowUpRightIcon />
              </span>
            )}
          </button>
        </li>
      ))}
    </ul>
  );
}
