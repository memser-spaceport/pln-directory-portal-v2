'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { FormProvider, useForm } from 'react-hook-form';

import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { FormTextArea } from '@/components/form/FormTextArea';
import { CloseIcon } from '@/components/icons';

import { DRAFT_KEYS } from '../mocks';
import { useTrackedFormDraft } from '../hooks/useTrackedFormDraft';
import { useDismissGuard } from '../hooks/useDismissGuard';
import { DraftStatus } from './DraftStatus';
import { DiscardStep } from './DiscardStep';
import s from '../styles.module.scss';

const MAX_LENGTH = 5000;

type FormValues = { message: string };
type Draft = { message: string };

const getDefaults = (): FormValues => ({ message: '' });

interface Props {
  mode: 'today' | 'proposed';
}

/**
 * Tier 2 — a modal containing free text (contact support, Demo Day feedback,
 * Deals "report a problem", Husky feedback).
 *
 * "Today" reproduces the live default: `Modal` closes on backdrop click and on
 * Escape, and the form resets — a stray click on the dimmed area destroys the
 * message. "Proposed" is the AI Apps feedback contract plus two additions:
 * a nudge so the refusal is legible, and an explicit discard step.
 */
export function FeedbackModalDemo({ mode }: Props) {
  const isProposed = mode === 'proposed';
  const [isOpen, setIsOpen] = useState(false);
  const [sent, setSent] = useState(0);
  const [showDismissHint, setShowDismissHint] = useState(false);

  const methods = useForm<FormValues>({ defaultValues: getDefaults() });
  const { watch, reset, handleSubmit } = methods;
  const message = watch('message');
  const isDirty = message.trim().length > 0;

  const { status, savedAt, clearDraft } = useTrackedFormDraft<FormValues, Draft>({
    storageKey: DRAFT_KEYS.feedbackModal,
    enabled: isProposed && isOpen,
    methods,
    getDefaults,
    toDraft: (form) => ({ message: form.message }),
    fromDraft: (draft) => ({ message: draft.message }),
    isEmpty: (draft) => !draft.message.trim(),
  });

  const close = () => {
    setIsOpen(false);
    setShowDismissHint(false);
  };

  const guard = useDismissGuard({ isDirty, onClose: close });

  /** Today: any dismissal wipes the message. Proposed: routed through the guard. */
  const handleTodayClose = () => {
    reset(getDefaults());
    close();
  };

  const onOutsideClick = () => {
    guard.onOutsideClick();
    if (isDirty) setShowDismissHint(true);
  };

  const onSubmit = handleSubmit(({ message: body }) => {
    if (!body.trim()) return;
    setSent((n) => n + 1);
    clearDraft();
    reset(getDefaults());
    close();
  });

  return (
    <>
      <div className={s.toolbar}>
        <Button size="s" onClick={() => setIsOpen(true)}>
          Give feedback
        </Button>
        <span className={s.toolbarNote}>
          {sent > 0 ? `${sent} sent this session · ` : ''}
          {isProposed
            ? 'Type, then click the dimmed backdrop — it holds. Close with × to meet the discard step.'
            : 'Type, then click the dimmed backdrop — the message is gone.'}
        </span>
      </div>

      <Modal
        isOpen={isOpen}
        // The whole fix, in one prop. Production's Modal already supports it;
        // almost nothing outside AI Apps and Gantry passes it.
        closeOnBackdropClick={!isProposed}
        closeOnEscape={!isProposed}
        onClose={isProposed ? onOutsideClick : handleTodayClose}
        className={s.modalContainer}
        ariaLabelledBy="proto-feedback-title"
        lockScroll
        inertBackground
      >
        <div className={clsx(s.modalRoot, isProposed && guard.nudge && s.modalNudge)}>
          <div className={s.modalHeader}>
            <h2 id="proto-feedback-title" className={s.modalTitle}>
              Give feedback
            </h2>
            <button
              type="button"
              className={s.closeButton}
              onClick={isProposed ? guard.requestClose : handleTodayClose}
              aria-label="Close"
            >
              <CloseIcon width={16} height={16} />
            </button>
          </div>

          <div className={s.modalContent}>
            <FormProvider {...methods}>
              <FormTextArea
                name="message"
                label="Your feedback"
                placeholder="What worked, what didn't, and what would make this more useful?"
                maxLength={MAX_LENGTH}
                showCharCount
                rows={6}
              />
            </FormProvider>
            {isProposed && showDismissHint && (
              <p className={s.dismissHint}>Your draft is safe. Use Cancel or × when you want to close this.</p>
            )}
          </div>

          <div className={s.modalFooter}>
            {isProposed && <DraftStatus status={status} savedAt={savedAt} />}
            <div className={s.modalFooterActions}>
              <Button style="border" variant="neutral" onClick={isProposed ? guard.requestClose : handleTodayClose}>
                Cancel
              </Button>
              <Button onClick={onSubmit} disabled={!isDirty}>
                Send feedback
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      <DiscardStep
        isOpen={guard.isConfirmingDiscard}
        subject="this feedback"
        onKeep={guard.keepDraft}
        onDiscard={() =>
          guard.confirmDiscard(() => {
            clearDraft();
            reset(getDefaults());
          })
        }
      />
    </>
  );
}
