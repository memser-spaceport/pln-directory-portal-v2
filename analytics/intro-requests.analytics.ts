import { useCallback } from 'react';
import { usePostHog } from 'posthog-js/react';

import { useCurrentUserStore } from '@/services/auth/store';
import { INTRO_REQUEST_ANALYTICS_EVENTS } from '@/utils/constants';

export type IntroRequestAnalyticsTargetType = 'member' | 'team';
export type IntroRequestEntryPoint = 'member-header' | 'team-header' | 'suggested-tab';
/** `modal`: the Request an intro dialog. `agent`: the LabOS agent's intro draft card (LAB-3300). */
export type IntroRequestSource = 'modal' | 'agent';

/** Shared properties on every intro request event. Never add message text, names or emails. */
export interface IntroRequestEventContext {
  targetType: IntroRequestAnalyticsTargetType;
  entryPoint: IntroRequestEntryPoint;
  source: IntroRequestSource;
}

export interface IntroRequestDialogClosedProps extends IntroRequestEventContext {
  hadText: boolean;
  textLength: number;
}

export interface IntroRequestSubmitFailedProps extends IntroRequestEventContext {
  status: number;
  textLength: number;
}

export interface IntroRequestAskSubmittedProps extends IntroRequestEventContext {
  textLength: number;
}

export function useIntroRequestAnalytics() {
  const posthog = usePostHog();

  const capture = useCallback(
    (event: string, properties: Record<string, unknown>) => {
      try {
        if (!posthog?.capture) return;
        const userInfo = useCurrentUserStore.getState().currentUser;
        posthog.capture(event, { ...properties, loggedInUserUid: userInfo?.uid });
      } catch (error) {
        console.error(error);
      }
    },
    [posthog],
  );

  const onButtonShown = useCallback(
    (context: IntroRequestEventContext) => capture(INTRO_REQUEST_ANALYTICS_EVENTS.BUTTON_SHOWN, { ...context }),
    [capture],
  );

  const onDialogOpened = useCallback(
    (context: IntroRequestEventContext) => capture(INTRO_REQUEST_ANALYTICS_EVENTS.DIALOG_OPENED, { ...context }),
    [capture],
  );

  const onDialogClosed = useCallback(
    (props: IntroRequestDialogClosedProps) => capture(INTRO_REQUEST_ANALYTICS_EVENTS.DIALOG_CLOSED, { ...props }),
    [capture],
  );

  const onSubmitFailed = useCallback(
    (props: IntroRequestSubmitFailedProps) => capture(INTRO_REQUEST_ANALYTICS_EVENTS.SUBMIT_FAILED, { ...props }),
    [capture],
  );

  const onAskSubmitted = useCallback(
    (props: IntroRequestAskSubmittedProps) =>
      capture(INTRO_REQUEST_ANALYTICS_EVENTS.ASK_SUBMITTED, { type: 'intro', ...props }),
    [capture],
  );

  return { onButtonShown, onDialogOpened, onDialogClosed, onSubmitFailed, onAskSubmitted };
}
