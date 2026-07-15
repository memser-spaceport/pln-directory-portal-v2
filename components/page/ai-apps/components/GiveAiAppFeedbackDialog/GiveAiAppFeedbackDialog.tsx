'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { useForm, FormProvider } from 'react-hook-form';
import { Modal } from '@/components/common/Modal/Modal';
import { Button } from '@/components/common/Button/Button';
import { FormTextArea } from '@/components/form/FormTextArea/FormTextArea';
import { FormSelect } from '@/components/form/FormSelect/FormSelect';
import { CloseIcon, CommentIcon } from '@/components/icons';
import { toast } from '@/components/core/ToastContainer';
import { useCurrentUserStore } from '@/services/auth/store';
import { useAiApps } from '@/services/ai-apps/hooks/useAiApps';
import { useSubmitAiAppFeedback } from '@/services/ai-app-feedback/hooks/useSubmitAiAppFeedback';
import { useAiAppsAnalytics } from '@/analytics/ai-apps.analytics';

import s from './GiveAiAppFeedbackDialog.module.scss';

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
  /** When provided (app detail page), the app is implicit and no picker is shown. */
  appUid?: string;
  appName?: string;
  /** Align the popover with the page's max-width content column instead of the viewport edge. */
  alignToContent?: boolean;
}

export function GiveAiAppFeedbackDialog({ isOpen, onClose, appUid, appName, alignToContent }: Props) {
  const { currentUser } = useCurrentUserStore();
  const { apps, isLoading: isAppsLoading } = useAiApps();
  const { mutate, isPending } = useSubmitAiAppFeedback();
  const analytics = useAiAppsAnalytics();

  const isPickerMode = !appUid;
  const appOptions: Option[] = apps.map((app) => ({ label: app.name, value: app.uid }));

  const methods = useForm<FormValues>({ defaultValues: { app: null, message: '' } });
  const { handleSubmit, reset, watch } = methods;
  const messageLength = watch('message').length;
  const isOverLimit = messageLength > MAX_LENGTH;
  const noAppsToPickFrom = isPickerMode && !isAppsLoading && appOptions.length === 0;
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const onDialogClose = () => {
    reset();
    setSubmitAttempted(false);
    onClose();
  };

  const onSubmit = handleSubmit(({ app, message }) => {
    setSubmitAttempted(true);
    const targetAppUid = appUid ?? app?.value;
    const trimmedMessage = message.trim();

    if (!targetAppUid || !trimmedMessage) {
      return;
    }

    mutate(
      { appUid: targetAppUid, text: trimmedMessage },
      {
        onSuccess: () => {
          analytics.onFeedbackSubmitted(targetAppUid, appName ?? app?.label ?? '');
          toast.success('Thanks for your feedback!');
          onDialogClose();
        },
        onError: () => {
          analytics.onFeedbackSubmitFailed(targetAppUid);
          toast.error('Something went wrong. Please try again.');
        },
      },
    );
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onDialogClose}
      closeOnBackdropClick={false}
      overlayClassname={clsx(s.overlay, alignToContent && s.overlayAlignToContent)}
      className={s.modalContainer}
    >
      <div className={s.root}>
        <div className={s.header}>
          <h2 className={s.title}>Give feedback</h2>
          <button type="button" className={s.closeButton} onClick={onDialogClose} aria-label="Close">
            <CloseIcon width={16} height={16} />
          </button>
        </div>

        <div className={s.content}>
          <FormProvider {...methods}>
            <div className={s.form}>
              {isPickerMode &&
                (noAppsToPickFrom ? (
                  <p className={s.emptyState}>No apps available to give feedback on yet.</p>
                ) : (
                  <>
                    <FormSelect
                      name="app"
                      label="Which app is this about?"
                      placeholder="Select an app…"
                      options={appOptions}
                      disabled={isAppsLoading}
                      isRequired
                    />
                    {submitAttempted && !watch('app') && <p className={s.fieldError}>Please select an app</p>}
                  </>
                ))}

              <FormTextArea
                name="message"
                label="Your feedback"
                placeholder="What worked, what didn’t, and what would make this more useful?"
                maxLength={MAX_LENGTH}
                showCharCount
                rows={6}
                disabled={noAppsToPickFrom}
              />
            </div>
          </FormProvider>

          <div className={s.postingAs}>
            <CommentIcon />
            <span>
              Posting as <strong>{currentUser?.name ?? 'you'}</strong> · visible to the app&apos;s author and LabOS
              admins
            </span>
          </div>
        </div>

        <div className={s.footer}>
          <Button style="border" variant="neutral" onClick={onDialogClose}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isPending || isOverLimit || noAppsToPickFrom}>
            {isPending ? 'Sending…' : 'Send feedback'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
