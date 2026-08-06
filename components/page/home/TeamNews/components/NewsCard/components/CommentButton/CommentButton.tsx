'use client';

import { clsx } from 'clsx';

import { useFeedCommentCount } from '@/services/feed/hooks/useFeedCommentCounts';

import s from './CommentButton.module.scss';

// Comment affordance for feed rows (news stories and forum posts) — same
// flattened forum-LikesButton styling as UpvoteButton so the actions row reads
// as one family. Subscribes to its own uid's slot in the shared feed counts
// cache (select-narrowed, so a count bump re-renders exactly this button, not
// the feed); undefined means "unknown" and renders no number (never a fake "0").
//
// A disclosure control for the card's inline thread — hence `aria-expanded` and
// `aria-controls`. Long threads escalate to the detail modal from inside the
// thread itself, not from here.

function CommentIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M13.5 3H2.50002C2.2348 3 1.98045 3.10536 1.79291 3.29289C1.60537 3.48043 1.50002 3.73478 1.50002 4V14C1.49886 14.1907 1.55281 14.3777 1.65537 14.5384C1.75793 14.6992 1.90473 14.8269 2.07814 14.9062C2.21029 14.9678 2.35425 14.9998 2.50002 15C2.73477 14.9994 2.96174 14.9157 3.14064 14.7638C3.14362 14.7618 3.14635 14.7595 3.14877 14.7569L5.15627 13H13.5C13.7652 13 14.0196 12.8946 14.2071 12.7071C14.3947 12.5196 14.5 12.2652 14.5 12V4C14.5 3.73478 14.3947 3.48043 14.2071 3.29289C14.0196 3.10536 13.7652 3 13.5 3ZM13.5 12H5.15627C4.92078 11.9999 4.69281 12.0829 4.51252 12.2344L4.50502 12.2413L2.50002 14V4H13.5V12Z"
        fill="currentColor"
      />
    </svg>
  );
}

interface CommentButtonProps {
  itemUid: string;
  open: boolean;
  onToggle: () => void;
  /** id of the thread region this button discloses. Unused (and not required)
   *  when `opensDetail` — there is no thread region to point at. */
  controls?: string;
  /**
   * Opens the detail modal instead of disclosing an inline thread — the
   * top-stories band, where an expanding thread would push the runners-up a
   * screen down. Swaps the disclosure ARIA (`aria-expanded`/`aria-controls`,
   * which would be a lie here: nothing expands and `controls` points at
   * nothing) for `aria-haspopup="dialog"`, matching how NewsGroupCard's story
   * rows announce the same modal.
   */
  opensDetail?: boolean;
}

export function CommentButton({ itemUid, open, onToggle, controls, opensDetail = false }: CommentButtonProps) {
  const count = useFeedCommentCount(itemUid);
  const noun = count === 1 ? 'Comment' : 'Comments';
  const visibleLabel = count !== undefined ? `${count} ${noun}` : noun;
  // The accessible name has to CARRY the visible text, not replace it: a bare
  // "Show comments" hides the count from screen readers and leaves voice
  // control with no way to say what it can see.
  const label = opensDetail ? `${visibleLabel}, open` : `${visibleLabel}, ${open ? 'hide' : 'show'}`;
  return (
    <button
      type="button"
      className={clsx(s.comment, open && s.commentOpen)}
      aria-expanded={opensDetail ? undefined : open}
      aria-controls={opensDetail ? undefined : controls}
      aria-haspopup={opensDetail ? 'dialog' : undefined}
      aria-label={label}
      title={label}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
    >
      <CommentIcon />
      <span>{visibleLabel}</span>
    </button>
  );
}
