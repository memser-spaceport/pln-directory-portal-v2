'use client';

import clsx from 'clsx';
import React from 'react';

import { formatAgo, getActionText, getCategoryTone } from './categories';
import { ArrowRightIcon, CheckIcon } from './icons';
import type { HubNotification } from './mocks';

import s from './NotificationsHub.module.scss';

type Props = {
  notification: HubNotification;
  variant: 'panel' | 'page';
  onToggleRead: (id: string) => void;
  /** Fired when the row's destination is opened. */
  onOpen: (notification: HubNotification) => void;
};

/**
 * One notification.
 *
 * Structural changes from production's `NotificationItem`:
 *
 * 1. The row is no longer a single `<Link>` wrapping everything. Only the
 *    content navigates; the read toggle sits outside it. In production the
 *    whole row is a link, which is why the only way to clear an unread is to
 *    navigate to its destination.
 * 2. Status and action are split (Airtable's arrangement): a non-interactive
 *    pip marks unread, and the actual toggle is a 28px target at the trailing
 *    end. Production has a single 5px dot on the right that is not clickable.
 *    The pip rides the category icon rather than taking its own column — a
 *    reserved column sits empty beside every read row, and dropping it
 *    per-row shifts the text sideways on toggle.
 * 3. A notification with no `link` renders as a plain block instead of a
 *    `<Link href="#">` — production gives dead rows a pointer cursor, a hover
 *    state, and a jump to the top of the page.
 * 4. Read/unread is the row's only action. There is no dismiss: a notification
 *    is a record of something that happened rather than a task to clear, and
 *    an irreversible delete sitting one 28px target away from a reversible
 *    toggle is a mis-tap waiting to happen.
 */
export function HubItem(props: Props) {
  const { notification, variant, onToggleRead, onOpen } = props;
  const { id, title, description, isRead, link, linkText, category, metadata, minutesAgo } = notification;

  const tone = getCategoryTone(category);
  const { Icon } = tone;

  const body = (
    <>
      <span className={s.iconWrapper} style={{ background: tone.bg, color: tone.fg }}>
        <Icon />
        {/*
          Unread pip rides the category icon instead of occupying its own
          leading column — a reserved column would sit empty beside every read
          row, and dropping it per-row would shift the text on toggle.
        */}
        {!isRead && <span className={s.unreadPip} />}
      </span>

      <span className={s.itemContent}>
        <span className={s.categoryBadge} style={{ background: tone.bg, color: tone.fg }}>
          {tone.label}
        </span>

        <span className={s.itemTitle}>{title}</span>
        {description && <span className={s.itemDescription}>{description}</span>}

        <span className={s.itemFooter}>
          <span className={s.meta}>{formatAgo(minutesAgo)}</span>
          {metadata?.viewCount != null && <span className={s.meta}>{metadata.viewCount} views</span>}
          {metadata?.voteCount != null && <span className={s.meta}>{metadata.voteCount} likes</span>}
          {metadata?.postCount != null && <span className={s.meta}>{metadata.postCount} comments</span>}

          {link && (
            <span className={s.actionText}>
              {linkText ?? getActionText(category)}
              {variant === 'page' && <ArrowRightIcon />}
            </span>
          )}
        </span>
      </span>
    </>
  );

  return (
    <div
      className={clsx(s.item, !isRead && s.itemUnread, !link && s.itemStatic)}
      // State is announced once, on the container, rather than being inferred
      // from a background tint.
      aria-label={`${tone.label}: ${title}. ${isRead ? 'Read' : 'Unread'}.`}
    >
      {link ? (
        // Prototype: mocked destinations, so the click is intercepted rather
        // than navigating away from the prototype.
        <a
          href={link}
          className={s.itemLink}
          onClick={(e) => {
            e.preventDefault();
            onOpen(notification);
          }}
        >
          {body}
        </a>
      ) : (
        <div className={s.itemLink}>{body}</div>
      )}

      {/*
        The row's only control now that dismiss is gone. Unread status is
        already carried by the pip on the category icon, so this button states
        the *action* rather than restating the state — and "mark as read" is a
        tick everywhere it appears. Direction is carried by colour (muted =
        will mark read, brand = already read, click to undo) plus the label,
        and either direction is reversible from the undo toast.
      */}
      <div className={s.itemActions}>
        <button
          type="button"
          className={clsx(s.readToggle, isRead && s.readToggleDone)}
          onClick={() => onToggleRead(id)}
          aria-label={isRead ? `Mark as unread: ${title}` : `Mark as read: ${title}`}
          title={isRead ? 'Mark as unread' : 'Mark as read'}
          aria-pressed={isRead}
        >
          <CheckIcon />
        </button>
      </div>
    </div>
  );
}
