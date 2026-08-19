'use client';

import { useCallback, useEffect, useRef } from 'react';
import Cookies from 'js-cookie';

import { useAuthAnalytics } from '@/analytics/auth.analytics';
import { authEvents } from '@/components/core/login/utils';
import { toast } from '@/components/core/ToastContainer';
import { updateUserDirectoryEmail } from '@/services/members.service';
import { IUserInfo } from '@/types/shared.types';
import { decodeToken } from '@/utils/auth.utils';
import { getAnalyticsUserInfo, triggerLoader } from '@/utils/common.utils';

export type EmailUpdateFailureReason = 'same-email' | 'rejected' | 'unexpected';

export interface EmailUpdateFailure {
  reason: EmailUpdateFailureReason;
  /** Ready to display — names the cause, not the status code. */
  message: string;
  newEmail: string;
}

interface Params {
  /** Member whose directory record changes — not necessarily `userInfo.uid` in admin views. */
  uid: string;
  /**
   * The address on record now; the update is refused when the new one matches it. Nullable
   * because a member record can reach a caller without one — a missing address simply never
   * matches, so the change goes through.
   */
  email: string | null | undefined;
  /** Analytics identity only — nullable because callers read it from a store that hydrates late. */
  userInfo: IUserInfo | null | undefined;
  /**
   * Render the failure. Defaults to a toast, which is what a form row can do; pass a handler to
   * put the message next to the control that failed instead.
   */
  onFailure?: (failure: EmailUpdateFailure) => void;
}

const sameEmailMessage = 'That’s already your email address. Enter the one you want to switch to.';

const rejectedMessage = (newEmail: string, reason?: string) =>
  reason
    ? `We couldn’t switch your email to ${newEmail}: ${reason}`
    : `We couldn’t switch your email to ${newEmail}. Try again, or contact support if it keeps failing.`;

/**
 * The email-change handoff, in one place: ask Privy to run the flow, then write the result to the
 * directory and to the session.
 *
 * Privy owns the two steps in the middle — entering the new address and the 6-digit code
 * (`updateEmail` in PrivyModals). `requestEmailChange()` hands over to it; Privy answers with
 * `auth:update-email`, and the listener here is where the directory record and the auth cookies
 * actually change. Every caller needs both halves, which is why they are returned together.
 *
 * Callers own presentation only: how the address is displayed, what the change affordance looks
 * like, and — through `onFailure` — where an error message goes.
 */
export function useUpdateEmail({ uid, email, userInfo, onFailure }: Params) {
  const analytics = useAuthAnalytics();

  // `auth:update-email` arrives long after the caller rendered, from a modal outside it. Refs
  // keep the handler on the current values without resubscribing on every render (neither
  // `useAuthAnalytics()` nor `userInfo` is referentially stable).
  const latest = useRef({ email, userInfo, analytics, onFailure });
  latest.current = { email, userInfo, analytics, onFailure };

  const requestEmailChange = useCallback(() => {
    const { userInfo: currentUserInfo, analytics: currentAnalytics } = latest.current;

    currentAnalytics.onUpdateEmailClicked(getAnalyticsUserInfo(currentUserInfo));

    // No session, no flow to start: completing it would change a real Privy email.
    if (!Cookies.get('authToken')) {
      return;
    }

    authEvents.emit('auth:link-account', 'updateEmail');
  }, []);

  useEffect(() => {
    async function updateUserEmail({ newEmail }: { newEmail: string }) {
      const { email: currentEmail, analytics: currentAnalytics, onFailure: currentOnFailure } = latest.current;
      const oldAccessToken = Cookies.get('authToken');

      if (!oldAccessToken) {
        return;
      }

      // Privy raised the app loader before handing back; every exit below has to lower it.
      const fail = (reason: EmailUpdateFailureReason, message: string) => {
        triggerLoader(false);

        if (currentOnFailure) {
          currentOnFailure({ reason, message, newEmail });
        } else {
          toast.error(message);
        }
      };

      if (newEmail === currentEmail) {
        currentAnalytics.onUpdateSameEmailProvided({ newEmail, oldEmail: currentEmail });
        fail('same-email', sameEmailMessage);
        return;
      }

      try {
        const result = await updateUserDirectoryEmail({ newEmail }, uid, {
          Authorization: `Bearer ${JSON.parse(oldAccessToken)}`,
          'Content-Type': 'application/json',
        });

        const { refreshToken, accessToken, userInfo: newUserInfo, isError, message } = result;

        // A refusal answers without tokens, so this covers both the flagged error and any
        // response too incomplete to reissue a session from.
        if (isError || !refreshToken || !accessToken) {
          currentAnalytics.onUpdateEmailFailure({ newEmail, oldEmail: currentEmail });
          fail('rejected', rejectedMessage(newEmail, message));
          return;
        }

        const accessTokenExpiry = decodeToken(accessToken);
        const refreshTokenExpiry = decodeToken(refreshToken);

        Cookies.set('authToken', JSON.stringify(accessToken), {
          expires: new Date(accessTokenExpiry.exp * 1000),
          domain: process.env.COOKIE_DOMAIN || '',
        });
        Cookies.set('refreshToken', JSON.stringify(refreshToken), {
          expires: new Date(refreshTokenExpiry.exp * 1000),
          domain: process.env.COOKIE_DOMAIN || '',
        });
        Cookies.set('userInfo', JSON.stringify(newUserInfo), {
          expires: new Date(refreshTokenExpiry.exp * 1000),
          domain: process.env.COOKIE_DOMAIN || '',
        });

        currentAnalytics.onUpdateEmailSuccess({ newEmail, oldEmail: currentEmail });
        toast.success('Email Updated Successfully');
        // Reload rather than refresh: the whole app reads identity from these cookies.
        window.location.reload();
      } catch {
        currentAnalytics.onUpdateEmailFailure({ newEmail, oldEmail: currentEmail });
        fail('unexpected', rejectedMessage(newEmail));
      }
    }

    return authEvents.on('auth:update-email', updateUserEmail);
  }, [uid]);

  return { requestEmailChange };
}
