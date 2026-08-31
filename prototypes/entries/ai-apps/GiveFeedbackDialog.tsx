'use client';

import { useCallback } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { Modal } from '@/components/common/Modal/Modal';
import { Button } from '@/components/common/Button/Button';
import { FormSelect } from '@/components/form/FormSelect/FormSelect';
import { FormTextArea } from '@/components/form/FormTextArea/FormTextArea';
import { CloseIcon, CommentIcon } from '@/components/icons';

// Production stylesheet imported verbatim — the card, header, form stack and
// footer are dev's.
import s from '@/components/page/ai-apps/components/GiveAiAppFeedbackDialog/GiveAiAppFeedbackDialog.module.scss';

import { currentUser, LABOS_AI_APPS_OPTION, type AiAppWithDoc } from './mocks';

const MAX_LENGTH = 5000;

interface Option {
  label: string;
  value: string;
}

interface FormValues {
  app: Option | null;
  message: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  apps: AiAppWithDoc[];
  /** Preselects this app in the picker (the detail view's fab always passes one). */
  appUid?: string;
  appName?: string;
  onSubmit: (appUid: string, appName: string, text: string) => void;
}

/**
 * COPY-SIMPLIFY of production `GiveAiAppFeedbackDialog`. Same composition and
 * the same stylesheet; the react-query mutation, contact-support fallback,
 * draft cache, toasts and analytics are dropped — submitting records the entry
 * in local state.
 *
 * One deliberate deviation from dev, and it is about the trigger moving:
 * production styles the overlay to hang bottom-right, unblurred, directly above
 * the FloatingFeedbackButton — chrome for a floating trigger. Here the trigger
 * lives at the top of the page header and the top of the detail bar, so a panel
 * opening at the far bottom-right would read as unrelated to the thing that was
 * pressed. Dropping `overlayClassname` restores Modal's own centered, dimmed
 * overlay, which is what every other dialog in the product uses.
 */
export function GiveFeedbackDialog({ isOpen, onClose, apps, appUid, appName, onSubmit }: Props) {
  const getDefaults = useCallback(
    (): FormValues => ({
      app: appUid && appName ? { label: appName, value: appUid } : null,
      message: '',
    }),
    [appUid, appName],
  );

  const methods = useForm<FormValues>({ defaultValues: getDefaults() });
  const { handleSubmit, reset, watch } = methods;

  const appOptions: Option[] = [
    LABOS_AI_APPS_OPTION,
    ...apps.map((app) => ({ label: app.name, value: app.uid })),
  ];

  const message = watch('message');
  const selectedApp = watch('app');
  const canSend = !!selectedApp?.value && message.trim().length > 0 && message.length <= MAX_LENGTH;

  const submit = handleSubmit(({ app, message: text }) => {
    const trimmed = text.trim();
    if (!app?.value || !trimmed) return;
    onSubmit(app.value, app.label, trimmed);
    reset(getDefaults());
    onClose();
  });

  const close = () => {
    reset(getDefaults());
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={close} closeOnBackdropClick={false} className={s.modalContainer}>
      <div className={s.root}>
        <div className={s.header}>
          <h2 className={s.title}>Give feedback</h2>
          <button type="button" className={s.closeButton} onClick={close} aria-label="Close">
            <CloseIcon width={16} height={16} />
          </button>
        </div>

        <div className={s.content}>
          <FormProvider {...methods}>
            <div className={s.form}>
              <FormSelect
                name="app"
                label="Which app is this about?"
                placeholder="Select an app…"
                options={appOptions}
                isRequired
              />
              <FormTextArea
                name="message"
                label="Your feedback"
                placeholder="What worked, what didn’t, and what would make this more useful?"
                maxLength={MAX_LENGTH}
                showCharCount
                rows={6}
              />
            </div>
          </FormProvider>

          {/* The one thing the form can't show: who this is attributed to, and
              who gets to read it. */}
          <div className={s.postingAs}>
            <CommentIcon />
            <span>
              {/* Explicit {' '} — JSX eats the space after the closing tag here,
                  so the separator renders glued to the name ("Bublii· visible").
                  Dev's GiveAiAppFeedbackDialog is written the same way and has
                  the same defect on screen. */}
              Posting as <strong>{currentUser.name}</strong>{' '}· visible to the app&apos;s author and LabOS admins
            </span>
          </div>
        </div>

        <div className={s.footer}>
          <Button style="border" variant="neutral" onClick={close}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!canSend}>
            Send feedback
          </Button>
        </div>
      </div>
    </Modal>
  );
}
