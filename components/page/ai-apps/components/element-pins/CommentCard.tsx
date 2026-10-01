'use client';

import { clsx } from 'clsx';
import { type ReactNode, useState } from 'react';
import { CloseIcon } from '@/components/icons';
import { getAvatarColor } from '@/components/page/ai-apps/AiAppFeedbackPage/utils/getAvatarColor';
import type { OverlayFeedbackPin } from '@/services/ai-app-feedback/ai-app-feedback.service';
// The feedback dialog's card (radius, shadow), as the prototype's card uses it.
import fd from '@/components/page/ai-apps/components/GiveAiAppFeedbackDialog/GiveAiAppFeedbackDialog.module.scss';
import { FeedbackTabs } from '../FeedbackTabs/FeedbackTabs';
import type { OverlayStatus } from './useFeedbackOverlay';

import s from './CommentMode.module.scss';

type Props = {
  commentCount: number;
  /** The Feedback tab: comment mode ends and the written form opens in its place. */
  onFeedbackTab: () => void;
  onClose: () => void;
  status: OverlayStatus;
  unplaced: { notFound: OverlayFeedbackPin[]; otherPages: [string, OverlayFeedbackPin[]][]; count: number };
  renderUnplacedPin: (pin: OverlayFeedbackPin) => ReactNode;
  onGoToPage: (pagePath: string) => void;
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

/**
 * The Comment tab of the feedback button's panel (prototype ai-apps-comments):
 * open for as long as comment mode is, above the button. It says how to leave a
 * comment — a click anywhere in the app — and who sees it. Comments it can't
 * draw on this page are listed under it until the comments panel takes them.
 */
export function CommentCard({
  commentCount,
  onFeedbackTab,
  onClose,
  status,
  unplaced,
  renderUnplacedPin,
  onGoToPage,
}: Props) {
  const [showUnplaced, setShowUnplaced] = useState(false);

  return (
    <section className={clsx(fd.root, s.dock)} aria-label="Comments on this app">
      <div className={s.top}>
        <FeedbackTabs
          active="comment"
          commentCount={commentCount}
          onSelect={(tab) => tab === 'feedback' && onFeedbackTab()}
        />
        <button type="button" className={s.iconButton} onClick={onClose} aria-label="Close comments">
          <CloseIcon width={14} height={14} />
        </button>
      </div>

      <div className={s.scroll}>
        <div className={s.hintBlock}>
          <p className={s.hintLead}>
            {status === 'unsupported'
              ? 'Click anywhere on the app to leave a comment. Comments already left are listed below.'
              : 'Click anywhere on the app to leave a comment.'}
          </p>
          <p className={s.audience}>Only the app’s author and admins see it.</p>
        </div>

        {unplaced.count > 0 && (
          <div className={s.unplaced}>
            <button
              type="button"
              className={s.unplacedToggle}
              aria-expanded={showUnplaced}
              onClick={() => setShowUnplaced((v) => !v)}
            >
              Not on screen ({unplaced.count})
              <span aria-hidden className={s.chevron} data-open={showUnplaced} />
            </button>
            {showUnplaced && (
              <div className={s.unplacedBody}>
                {unplaced.notFound.length > 0 && (
                  <section className={s.group}>
                    <h3 className={s.groupTitle}>Not on the current version</h3>
                    <ul className={s.list}>
                      {unplaced.notFound.map((pin) => (
                        <li key={pin.uid} className={s.item}>
                          {renderUnplacedPin(pin)}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
                {unplaced.otherPages.map(([page, list]) => (
                  <section key={page} className={s.group}>
                    <div className={s.pageHead}>
                      <h3 className={s.groupTitle}>
                        <code>{page}</code> · {list.length}
                      </h3>
                      <button type="button" className={s.linkButton} onClick={() => onGoToPage(page)}>
                        Go to page
                      </button>
                    </div>
                    <ul className={s.list}>
                      {list.map((pin) => {
                        const name = pin.feedback.member?.name ?? 'A member';
                        return (
                          <li key={pin.uid} className={s.itemCompact}>
                            <span className={s.dot} style={{ background: getAvatarColor(name) }} aria-hidden>
                              {initials(name)}
                            </span>
                            <span className={s.itemText}>{pin.note || 'No comment'}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
