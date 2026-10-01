'use client';

import { clsx } from 'clsx';
import { type ReactNode, useState } from 'react';
import { Button } from '@/components/common/Button/Button';
import { CloseIcon } from '@/components/icons';
import { getAvatarColor } from '@/components/page/ai-apps/AiAppFeedbackPage/utils/getAvatarColor';
import type { OverlayFeedbackPin } from '@/services/ai-app-feedback/ai-app-feedback.service';
// The feedback dialog's card (radius, shadow), as the prototype's dock uses it.
import fd from '@/components/page/ai-apps/components/GiveAiAppFeedbackDialog/GiveAiAppFeedbackDialog.module.scss';
import { AnnotatorModal } from '../screenshot-feedback/AnnotatorModal';
import { hasAnyAnnotation } from '../screenshot-feedback/types';
import type { CommentDraft, CommentDrafts } from './commentDrafts';
import type { OverlayStatus } from './useFeedbackOverlay';

import s from './CommentMode.module.scss';

type Props = {
  appName: string;
  drafts: CommentDrafts;
  /** The picture a draft's Screenshot chip shows and the annotator opens. */
  cropPreview: (draft: CommentDraft) => string | null;
  onRemoveDraft: (draft: CommentDraft) => void;
  onClearDrafts: () => void;
  sentCount: number;
  isSending: boolean;
  onSend: () => void;
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
 * Comment mode's dock (prototype DraftsPanel): open for as long as the mode is.
 * The queued comments with their screenshots (marked up with production's
 * annotator), a comment about the whole app, what can't be shown on the page,
 * and Send — everything goes together, one feedback item per pinned comment.
 */
export function CommentDock({
  appName,
  drafts,
  cropPreview,
  onRemoveDraft,
  onClearDrafts,
  sentCount,
  isSending,
  onSend,
  onClose,
  status,
  unplaced,
  renderUnplacedPin,
  onGoToPage,
}: Props) {
  const [showUnplaced, setShowUnplaced] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const editing = drafts.drafts.find((d) => d.id === editingId) ?? null;
  const editingSrc = editing ? cropPreview(editing) : null;

  const count = drafts.drafts.length;
  const preparing = drafts.drafts.some((d) => d.cropState === 'pending');
  const canSend = (count > 0 || drafts.general.trim().length > 0) && !preparing && !isSending;

  return (
    <section className={clsx(fd.root, s.dock)} aria-label="Feedback on this app">
      <div className={s.top}>
        <div className={s.chips}>
          {count > 0 && (
            <span className={s.chip}>
              {count} {count === 1 ? 'comment' : 'comments'}
            </span>
          )}
          <span className={s.chip}>{appName}</span>
        </div>
        {count > 0 && (
          <button type="button" className={s.linkButton} onClick={onClearDrafts}>
            Clear
          </button>
        )}
      </div>

      <div className={s.scroll}>
        {count === 0 && (
          <p className={s.hint} aria-live="polite">
            {sentCount > 0
              ? `Sent ${sentCount} ${sentCount === 1 ? 'comment' : 'comments'}.`
              : status === 'unsupported'
                ? 'Click anything in the app to pin a comment, or write one below. Comments already left are listed under Not on screen.'
                : 'Click anything in the app to pin a comment with a screenshot, or write one below.'}
          </p>
        )}

        {count > 0 && (
          <ul className={s.list}>
            {drafts.drafts.map((draft, i) => {
              const src = cropPreview(draft);
              const annotated = hasAnyAnnotation(draft.annotations);
              return (
                <li key={draft.id} className={s.draft}>
                  <span className={s.draftNumber}>{i + 1}</span>
                  <div className={s.draftBody}>
                    <div className={s.draftHead}>
                      <span className={s.draftLabel}>Comment</span>
                      {draft.cropState === 'pending' && !src ? (
                        <span className={clsx(s.shotChip, s.shotChipPending)} aria-label="Preparing screenshot" />
                      ) : src ? (
                        <button
                          type="button"
                          className={s.shotChip}
                          onClick={() => setEditingId(draft.id)}
                          aria-label={annotated ? 'Edit marks on the screenshot' : 'Mark up the screenshot'}
                        >
                          <img src={src} alt="" />
                          Screenshot{annotated ? ' · marked' : ''}
                        </button>
                      ) : null}
                    </div>
                    <p className={s.draftText}>{draft.note}</p>
                  </div>
                  <button
                    type="button"
                    className={s.iconButton}
                    onClick={() => onRemoveDraft(draft)}
                    aria-label={`Remove comment ${i + 1}`}
                  >
                    <CloseIcon width={14} height={14} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <div className={s.whole}>
          <span className={s.wholeLabel}>Whole app</span>
          <textarea
            className={s.composerField}
            rows={3}
            maxLength={5000}
            aria-label="Comment about the whole app"
            placeholder="Leave a comment for the app’s author…"
            value={drafts.general}
            onChange={(e) => drafts.setGeneral(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && canSend) {
                e.preventDefault();
                onSend();
              }
            }}
          />
          <p className={s.audience}>Visible to the app’s author and LabOS admins.</p>
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
                    <h3 className={s.groupTitle}>Not found on this page</h3>
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

      <div className={s.footer}>
        <Button style="link" variant="neutral" size="s" onClick={onClose}>
          Close
        </Button>
        <Button size="s" disabled={!canSend} onClick={onSend}>
          {isSending ? 'Sending…' : preparing ? 'Preparing…' : 'Send'}
        </Button>
      </div>

      {editing && editingSrc && (
        <AnnotatorModal
          imageSrc={editingSrc}
          initialAnnotations={editing.annotations ?? undefined}
          onDiscard={() => setEditingId(null)}
          onAdd={(annotations) => {
            drafts.update(editing.id, { annotations });
            setEditingId(null);
          }}
        />
      )}
    </section>
  );
}
