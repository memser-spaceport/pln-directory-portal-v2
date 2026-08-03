'use client';

import clsx from 'clsx';

import { summarizeView, viewHashKey, type FeedView } from './feedView';
import local from './NewsfeedV0.module.scss';

interface Props {
  savedFilter: FeedView;
  /** The view on screen — the chip highlights when it's the saved one. */
  view: FeedView;
  onApply: () => void;
  onClear: () => void;
}

/**
 * The saved filter as a chip in the toolbar, beside Sort.
 *
 * The banner is a one-time offer — it appears when you filter and goes quiet
 * once you've saved. This is the standing entry point: a persistent, one-click
 * way back to your filter from anywhere in the feed, and the only place the
 * saved filter is visible when you're reading something else.
 *
 * Body applies, × clears — production's saved-view chip interaction
 * (`InvestorsFilterRail`), whose styles this reuses.
 */
export function SavedFilterChip({ savedFilter, view, onApply, onClear }: Props) {
  const active = viewHashKey(savedFilter) === viewHashKey(view);
  const label = summarizeView(savedFilter);

  return (
    <span className={clsx(local.savedView, local.savedFilterChip, active && local.savedViewActive)}>
      <BookmarkIcon />
      <button
        type="button"
        className={local.savedViewBody}
        aria-pressed={active}
        title={active ? `Showing your saved filter: ${label}` : `Apply your saved filter: ${label}`}
        onClick={onApply}
      >
        {label}
      </button>
      <button
        type="button"
        className={local.savedViewDelete}
        aria-label={`Clear saved filter ${label}`}
        onClick={onClear}
      >
        <CloseGlyph />
      </button>
    </span>
  );
}

// Bookmark mark — says "saved" without spending a word on it, so the chip's text
// can be the filter itself rather than the label "Saved filter: …".
const BookmarkIcon = () => (
  <svg viewBox="0 0 12 12" fill="none" aria-hidden className={local.savedFilterChipIcon}>
    <path
      d="M3 2.2h6c.28 0 .5.22.5.5v7.05L6 8.1l-3.5 1.65V2.7c0-.28.22-.5.5-.5Z"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinejoin="round"
    />
  </svg>
);

const CloseGlyph = () => (
  <svg viewBox="0 0 12 12" fill="none" aria-hidden>
    <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);
