'use client';

import { useState } from 'react';
import { Dialog } from '@base-ui-components/react/dialog';
import { useReviewFounder } from '@/services/founders/hooks/useReviewFounder';
import { PLATFORM_FEEDBACK_AREAS, RECORD_QUALITY_FIELDS, REVIEW_CHANNEL_LABEL } from '@/services/founders/constants';
import type { FounderStatus, ReviewChannel } from '@/services/founders/types';
import { useFoundersAnalytics } from '@/analytics/founders.analytics';
import s from './ReviewActionsPanel.module.scss';

type ReviewAction = 'feedback' | 'approve' | 'reject';

interface Props {
  founderId: string;
  currentStatus: FounderStatus;
}

export function ReviewActionsPanel({ founderId, currentStatus }: Props) {
  const [openAction, setOpenAction] = useState<ReviewAction | null>(null);
  const [note, setNote] = useState('');
  const [feedbackChannel, setFeedbackChannel] = useState<ReviewChannel>('record-quality');
  const [recordField, setRecordField] = useState<string>(RECORD_QUALITY_FIELDS[0]);
  const [platformArea, setPlatformArea] = useState<string>(PLATFORM_FEEDBACK_AREAS[0]);

  const { mutate, isPending } = useReviewFounder();
  const analytics = useFoundersAnalytics();

  const closeModal = () => setOpenAction(null);

  const submit = () => {
    if (!openAction) return;
    const trimmedNote = note.trim() || undefined;

    if (openAction === 'approve') {
      mutate(
        { id: founderId, body: { status: 'approved', channel: 'lead-decision', note: trimmedNote } },
        {
          onSuccess: () => {
            analytics.onReviewSubmitted(founderId, 'approved', false, !!trimmedNote);
            closeModal();
          },
          onError: () => analytics.onReviewFailed(founderId),
        },
      );
      return;
    }

    if (openAction === 'reject') {
      mutate(
        { id: founderId, body: { status: 'rejected', channel: 'lead-decision', note: trimmedNote } },
        {
          onSuccess: () => {
            analytics.onReviewSubmitted(founderId, 'rejected', false, !!trimmedNote);
            closeModal();
          },
          onError: () => analytics.onReviewFailed(founderId),
        },
      );
      return;
    }

    mutate(
      {
        id: founderId,
        body: {
          channel: feedbackChannel,
          field: feedbackChannel === 'record-quality' ? recordField : undefined,
          area: feedbackChannel === 'platform' ? platformArea : undefined,
          note: trimmedNote,
        },
      },
      {
        onSuccess: () => {
          analytics.onReviewSubmitted(founderId, currentStatus, false, !!trimmedNote);
          closeModal();
        },
        onError: () => analytics.onReviewFailed(founderId),
      },
    );
  };

  const modalTitle =
    openAction === 'approve' ? 'Approve founder' : openAction === 'reject' ? 'Reject founder' : 'Leave feedback';

  return (
    <div className={s.wrap}>
      <div className={s.actions}>
        <button type="button" className={s.btnSecondary} onClick={() => setOpenAction('feedback')}>
          Feedback
        </button>
        <button type="button" className={s.btnApprove} onClick={() => setOpenAction('approve')}>
          Approve
        </button>
        <button type="button" className={s.btnReject} onClick={() => setOpenAction('reject')}>
          Reject
        </button>
      </div>

      <Dialog.Root open={openAction !== null} onOpenChange={(next) => !next && closeModal()}>
        <Dialog.Portal>
          <Dialog.Backdrop className={s.backdrop} />
          <Dialog.Popup className={s.modal}>
            <Dialog.Title className={s.modalTitle}>{modalTitle}</Dialog.Title>

            {openAction === 'feedback' && (
              <div className={s.modalFields}>
                <label className={s.fieldLabel}>
                  Feedback type
                  <select
                    className={s.select}
                    value={feedbackChannel}
                    onChange={(e) => setFeedbackChannel(e.target.value as ReviewChannel)}
                  >
                    <option value="record-quality">{REVIEW_CHANNEL_LABEL['record-quality']}</option>
                    <option value="platform">{REVIEW_CHANNEL_LABEL.platform}</option>
                  </select>
                </label>
                {feedbackChannel === 'record-quality' && (
                  <label className={s.fieldLabel}>
                    Field
                    <select className={s.select} value={recordField} onChange={(e) => setRecordField(e.target.value)}>
                      {RECORD_QUALITY_FIELDS.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                {feedbackChannel === 'platform' && (
                  <label className={s.fieldLabel}>
                    Area
                    <select className={s.select} value={platformArea} onChange={(e) => setPlatformArea(e.target.value)}>
                      {PLATFORM_FEEDBACK_AREAS.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>
            )}

            <label className={s.fieldLabel} htmlFor="review-note">
              Comment <span className={s.optional}>(optional)</span>
            </label>
            <textarea
              id="review-note"
              className={s.noteInput}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note for the team…"
              maxLength={500}
              rows={4}
            />
            <div className={s.charCount}>{note.length}/500</div>

            <div className={s.modalFooter}>
              <button type="button" className={s.btnSecondary} onClick={closeModal} disabled={isPending}>
                Cancel
              </button>
              <button type="button" className={s.btnPrimary} onClick={submit} disabled={isPending}>
                {isPending ? 'Saving…' : 'Save'}
              </button>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
