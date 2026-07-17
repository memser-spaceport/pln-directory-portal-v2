'use client';

import { useCallback, useState } from 'react';
import clsx from 'clsx';
import { useForm, FormProvider } from 'react-hook-form';
import { Modal } from '@/components/common/Modal/Modal';
import { Button } from '@/components/common/Button/Button';
import { FormTextArea } from '@/components/form/FormTextArea/FormTextArea';
import { FormSelect } from '@/components/form/FormSelect/FormSelect';
import { CloseIcon, CommentIcon } from '@/components/icons';
import { toast } from '@/components/core/ToastContainer';
import { useContactSupport } from '@/components/ContactSupport/hooks/useContactSupport';
import { useFormDraft } from '@/hooks/useFormDraft';
import { useCurrentUserStore } from '@/services/auth/store';
import { useAiApps } from '@/services/ai-apps/hooks/useAiApps';
import { useSubmitAiAppFeedback } from '@/services/ai-app-feedback/hooks/useSubmitAiAppFeedback';
import { useAiAppsAnalytics } from '@/analytics/ai-apps.analytics';

import s from './GiveAiAppFeedbackDialog.module.scss';

const MAX_LENGTH = 5000;
export const AI_APP_FEEDBACK_DRAFT_KEY = 'form-draft:ai-app-feedback';

export const LABOS_AI_APPS_OPTION = {
  label: 'LabOS - AI Apps',
  value: '__labos_ai_apps__',
} as const;

interface Option {
  label: string;
  value: string;
}

interface FormValues {
  app: Option | null;
  message: string;
}

type FeedbackDraft = {
  message: string;
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** When provided (app detail page), preselects this app in the picker. */
  appUid?: string;
  appName?: string;
  /** Align the popover with the page's max-width content column instead of the viewport edge. */
  alignToContent?: boolean;
}

function getDefaultApp(appUid?: string, appName?: string): Option | null {
  if (!appUid || !appName) {
    return null;
  }

  return { label: appName, value: appUid };
}

export function GiveAiAppFeedbackDialog({ isOpen, onClose, appUid, appName, alignToContent }: Props) {
  const { currentUser } = useCurrentUserStore();
  const { apps, isLoading: isAppsLoading } = useAiApps();
  const { mutate: submitAppFeedback, isPending: isAppFeedbackPending } = useSubmitAiAppFeedback();
  const { mutate: submitContactSupport, isPending: isContactSupportPending } = useContactSupport();
  const analytics = useAiAppsAnalytics();

  const appOptions: Option[] = [LABOS_AI_APPS_OPTION, ...apps.map((app) => ({ label: app.name, value: app.uid }))];

  const getDefaults = useCallback(
    (): FormValues => ({ app: getDefaultApp(appUid, appName), message: '' }),
    [appUid, appName],
  );

  const methods = useForm<FormValues>({
    defaultValues: getDefaults(),
  });
  const { handleSubmit, reset, watch } = methods;
  const { clearDraft } = useFormDraft<FormValues, FeedbackDraft>({
    storageKey: AI_APP_FEEDBACK_DRAFT_KEY,
    enabled: isOpen,
    methods,
    getDefaults,
    toDraft: (form) => ({ message: form.message }),
    fromDraft: (draft) => ({ ...getDefaults(), message: draft.message }),
    isEmpty: (draft) => !draft.message.trim(),
  });
  const messageLength = watch('message').length;
  const isOverLimit = messageLength > MAX_LENGTH;
  const isPending = isAppFeedbackPending || isContactSupportPending;
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const onDialogClose = () => {
    setSubmitAttempted(false);
    onClose();
  };

  const onSubmitSuccess = () => {
    clearDraft();
    reset(getDefaults());
    setSubmitAttempted(false);
    onClose();
  };

  const onSubmit = handleSubmit(({ app, message }) => {
    setSubmitAttempted(true);
    const trimmedMessage = message.trim();

    if (!app?.value || !trimmedMessage) {
      return;
    }

    if (app.value === LABOS_AI_APPS_OPTION.value) {
      const email = currentUser?.email;
      const name = currentUser?.name;

      if (!email || !name) {
        toast.error('Something went wrong. Please try again.');
        return;
      }

      submitContactSupport(
        {
          topic: 'Give feedback',
          email,
          name,
          message: `AI Apps Feedback: ${trimmedMessage}`,
          metadata: {
            logged: Boolean(currentUser),
            uid: currentUser?.uid || '',
            page: window.location.toString(),
          },
        },
        {
          onSuccess: onSubmitSuccess,
        },
      );
      return;
    }

    submitAppFeedback(
      { appUid: app.value, text: trimmedMessage },
      {
        onSuccess: () => {
          analytics.onFeedbackSubmitted(app.value, app.label);
          toast.success('Thanks for your feedback!');
          onSubmitSuccess();
        },
        onError: () => {
          analytics.onFeedbackSubmitFailed(app.value);
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
              <FormSelect
                name="app"
                label="Which app is this about?"
                placeholder="Select an app…"
                options={appOptions}
                disabled={isAppsLoading}
                isRequired
              />
              {submitAttempted && !watch('app') && <p className={s.fieldError}>Please select an app</p>}

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
          <Button onClick={onSubmit} disabled={isPending || isOverLimit}>
            {isPending ? 'Sending…' : 'Send feedback'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
