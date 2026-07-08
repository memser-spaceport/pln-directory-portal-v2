'use client';

import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { Modal } from '@/components/common/Modal/Modal';
import { Button } from '@/components/common/Button/Button';
import { FormTextArea } from '@/components/form/FormTextArea/FormTextArea';
import { FormSelect } from '@/components/form/FormSelect/FormSelect';
import { CloseIcon } from '@/components/icons';
import { toast } from '@/components/core/ToastContainer';
import { useCurrentUserStore } from '@/services/auth/store';
import { useAiApps } from '@/services/ai-apps/hooks/useAiApps';
import { useSubmitAiAppFeedback } from '@/services/ai-app-feedback/hooks/useSubmitAiAppFeedback';
import { useAiAppsAnalytics } from '@/analytics/ai-apps.analytics';

import s from './GiveAiAppFeedbackDialog.module.scss';

const MAX_LENGTH = 1000;

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
}

export function GiveAiAppFeedbackDialog({ isOpen, onClose, appUid, appName }: Props) {
  const { currentUser } = useCurrentUserStore();
  const { apps, isLoading: isAppsLoading } = useAiApps();
  const { mutate, isPending } = useSubmitAiAppFeedback();
  const analytics = useAiAppsAnalytics();

  const isPickerMode = !appUid;
  const appOptions: Option[] = apps.map((app) => ({ label: app.name, value: app.uid }));

  const methods = useForm<FormValues>({ defaultValues: { app: null, message: '' } });
  const { handleSubmit, reset, watch } = methods;
  const isOverLimit = watch('message').length > MAX_LENGTH;
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
      { appUid: targetAppUid, message: trimmedMessage },
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
    <Modal isOpen={isOpen} onClose={onDialogClose}>
      <div className={s.root}>
        <button type="button" className={s.closeButton} onClick={onDialogClose} aria-label="Close">
          <CloseIcon width={16} height={16} />
        </button>

        <div className={s.content}>
          <h2 className={s.title}>Give feedback</h2>
          <p className={s.description}>
            Posting as {currentUser?.name ?? 'you'}. Visible to the app&apos;s author and Directory admins.
          </p>

          <FormProvider {...methods}>
            <div className={s.form}>
              {isPickerMode &&
                (noAppsToPickFrom ? (
                  <p className={s.emptyState}>No apps available to give feedback on yet.</p>
                ) : (
                  <>
                    <FormSelect
                      name="app"
                      label="App"
                      placeholder="Select an app"
                      options={appOptions}
                      disabled={isAppsLoading}
                      isRequired
                    />
                    {submitAttempted && !watch('app') && <p className={s.fieldError}>Please select an app</p>}
                  </>
                ))}

              <FormTextArea
                name="message"
                label="Feedback"
                placeholder="Share your thoughts"
                maxLength={MAX_LENGTH}
                showCharCount
                rows={5}
                disabled={noAppsToPickFrom}
              />
            </div>
          </FormProvider>
        </div>

        <div className={s.footer}>
          <Button style="border" variant="neutral" onClick={onDialogClose}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isPending || isOverLimit || noAppsToPickFrom}>
            {isPending ? 'Submitting...' : 'Submit'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
