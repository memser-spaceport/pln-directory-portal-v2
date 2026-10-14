'use client';

import { clsx } from 'clsx';
import { useState } from 'react';
import { Button } from '@/components/common/Button/Button';
import { getAvatarColor } from '@/components/page/ai-apps/AiAppFeedbackPage/utils/getAvatarColor';
import {
  AI_APP_FEEDBACK_STATUSES,
  AI_APP_FEEDBACK_STATUS_LABELS,
  type AiAppFeedbackStatus,
} from '@/services/ai-app-feedback/constants';
import type { OverlayFeedbackPin } from '@/services/ai-app-feedback/ai-app-feedback.service';
import type { OverlayStatus } from './useFeedbackOverlay';
// The status pill the author sets, so the list reads the same.
import st from '@/components/page/ai-apps/AiAppFeedbackPage/components/FeedbackStatusSelector/FeedbackStatusSelector.module.scss';

import s from './CommentsDrawer.module.scss';

/** Where a comment's element is, as far as this page load knows. */
export type CommentWhere =
  | { kind: 'here' }
  | { kind: 'locating' }
  /** The page it was left on is open, and its element isn't there any more. */
  | { kind: 'gone' }
  | { kind: 'otherPage'; path: string }
  /** The app's bridge can't locate: nothing is known either way. */
  | { kind: 'unknown' };

export type CommentListItem = { pin: OverlayFeedbackPin; where: CommentWhere };

type Filter = 'ALL' | AiAppFeedbackStatus;

type Props = {
  items: CommentListItem[];
  /** The pin whose thread is open; its row is highlighted. */
  openPinUid: string | null;
  onSelect: (item: CommentListItem) => void;
  /** The overlay's state: an app that cannot locate says its comments open from the list. */
  status: OverlayStatus;
  /**
   * Phone (LAB-2796): the drawer covers the app, so there is no "click anywhere".
   * "Add a comment", under the list, puts the drawer aside so a spot can be tapped.
   */
  onAddComment?: () => void;
};

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/** "just now", "5m ago", "5h ago", "6d ago", then the date — the prototype's list times. */
export function shortAgo(iso: string, now = Date.now()): string {
  const minutes = Math.floor((now - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const KIND_BY_TAG: Record<string, string> = {
  a: 'Link',
  button: 'Button',
  input: 'Field',
  textarea: 'Field',
  select: 'Field',
  img: 'Image',
  svg: 'Image',
  canvas: 'Chart',
  table: 'Table',
  tr: 'Row',
  td: 'Cell',
  th: 'Cell',
  li: 'Item',
  label: 'Label',
  p: 'Text',
  span: 'Text',
  h1: 'Heading',
  h2: 'Heading',
  h3: 'Heading',
  h4: 'Heading',
  h5: 'Heading',
  h6: 'Heading',
  nav: 'Menu',
  form: 'Form',
};

const KIND_BY_ROLE: Record<string, string> = {
  button: 'Button',
  link: 'Link',
  tab: 'Tab',
  menuitem: 'Menu item',
  checkbox: 'Checkbox',
  textbox: 'Field',
  img: 'Image',
  heading: 'Heading',
  dialog: 'Dialog',
};

/**
 * What a comment points at, the way a person would name it: `Link "Draft intro"`,
 * `Card "92% match score"` (prototype ai-apps-comments). Containers read as cards.
 */
export function describeTarget(pin: Pick<OverlayFeedbackPin, 'tag' | 'role' | 'text' | 'ariaLabel' | 'selector'>) {
  const kind = (pin.role && KIND_BY_ROLE[pin.role]) || KIND_BY_TAG[pin.tag.toLowerCase()] || 'Card';
  const raw = (pin.ariaLabel || pin.text || '').replace(/\s+/g, ' ').trim();
  const label = raw.length > 48 ? `${raw.slice(0, 47).trimEnd()}…` : raw;
  return label ? `${kind} “${label}”` : kind;
}

function PinMarkIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M8 14.5s4.5-4.2 4.5-7.8a4.5 4.5 0 1 0-9 0c0 3.6 4.5 7.8 4.5 7.8Z"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <circle cx="8" cy="6.7" r="1.6" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

/**
 * Every comment on the app, newest first (prototype ai-apps-comments
 * CommentsDrawer): who, when, its status, what it points at — or that the
 * element isn't on the current version any more — what was said, and how many
 * replies. A row opens its thread. It is the body of the feedback drawer's
 * Comments tab (LAB-2767), so the drawer's title, switcher and ✕ head it; above
 * the list it says how to leave a comment and who sees it.
 */
export function CommentsDrawer({ items, openPinUid, onSelect, status, onAddComment }: Props) {
  const [filter, setFilter] = useState<Filter>('ALL');
  const shown = filter === 'ALL' ? items : items.filter((item) => item.pin.feedback.status === filter);

  return (
    <aside className={s.drawer} aria-label="Comments">
      <header className={s.head}>
        {onAddComment ? (
          <div className={s.hint}>
            <p className={s.audience}>Everyone who can open this app can see them.</p>
          </div>
        ) : (
          <div className={s.hint}>
            <p className={s.hintLead}>
              {status === 'unsupported'
                ? 'Click anywhere on the app to leave a comment. This app can’t show where earlier comments point; open them from the list.'
                : 'Click anywhere on the app to leave a comment.'}
            </p>
            <p className={s.audience}>Everyone who can open this app can see it.</p>
          </div>
        )}
        <select
          className={s.filter}
          aria-label="Show comments"
          value={filter}
          onChange={(e) => setFilter(e.target.value as Filter)}
        >
          <option value="ALL">All</option>
          {AI_APP_FEEDBACK_STATUSES.map((value) => (
            <option key={value} value={value}>
              {AI_APP_FEEDBACK_STATUS_LABELS[value]}
            </option>
          ))}
        </select>
      </header>

      {shown.length === 0 ? (
        <p className={s.empty}>
          {items.length === 0
            ? onAddComment
              ? 'No comments yet.'
              : 'No comments yet. Click anywhere on the app to leave one.'
            : `No ${AI_APP_FEEDBACK_STATUS_LABELS[filter as AiAppFeedbackStatus]} comments.`}
        </p>
      ) : (
        <ul className={s.list}>
          {shown.map((item) => (
            <CommentRow
              key={item.pin.feedbackUid}
              item={item}
              selected={item.pin.uid === openPinUid}
              onSelect={() => onSelect(item)}
            />
          ))}
        </ul>
      )}
      {/* Phone: the way to write stays in reach under the list, however long it gets. */}
      {onAddComment && (
        <div className={s.phoneFooter}>
          <Button size="s" className={s.addButton} onClick={onAddComment}>
            <PinMarkIcon />
            Add a comment
          </Button>
        </div>
      )}
    </aside>
  );
}

function CommentRow({ item, selected, onSelect }: { item: CommentListItem; selected: boolean; onSelect: () => void }) {
  const { pin, where } = item;
  const name = pin.feedback.member?.name ?? 'A member';
  const status = pin.feedback.status;
  const replies = pin.feedback.commentCount ?? 0;
  const target = describeTarget(pin);

  return (
    <li className={clsx(s.row, selected && s.rowSelected)}>
      <button type="button" className={s.rowButton} onClick={onSelect} aria-current={selected ? 'true' : undefined}>
        <span className={s.rowHead}>
          <span className={s.avatar} style={{ background: getAvatarColor(name) }} aria-hidden>
            {initials(name)}
          </span>
          <span className={s.name}>{name}</span>
          <span className={s.time}>{shortAgo(pin.feedback.createdAt)}</span>
          <span className={clsx(st.badge, st[`badge_${status}`], s.status)}>
            {AI_APP_FEEDBACK_STATUS_LABELS[status]}
          </span>
        </span>
        {where.kind === 'gone' ? (
          <span className={clsx(s.where, s.whereGone)}>
            Not on the current version · <s>{target}</s>
          </span>
        ) : (
          <span className={s.where}>
            <PinMarkIcon />
            {target}
            {where.kind === 'otherPage' && <span className={s.page}>{where.path}</span>}
          </span>
        )}
        <span className={s.note}>{pin.note || <em className={s.noNote}>No comment</em>}</span>
        {replies > 0 && <span className={s.replies}>{replies === 1 ? '1 reply' : `${replies} replies`}</span>}
      </button>
    </li>
  );
}
